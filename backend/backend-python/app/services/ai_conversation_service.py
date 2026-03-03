from abc import ABC, abstractmethod
import logging
import asyncio
from typing import List, Optional, Dict, Any
from openai import OpenAI
import os

from app.models.conversation import ConversationScenario, ConversationMessage

logger = logging.getLogger(__name__)

class IAIConversationService(ABC):
    """Abstract interface for AI conversation service"""
    
    @abstractmethod
    async def initialize_conversation(
        self,
        session_id: str,
        scenario: ConversationScenario,
        messages: List[ConversationMessage]
    ) -> None:
        pass
    
    @abstractmethod
    async def generate_response(
        self,
        session_id: str,
        user_message: str,
        conversation_context: List[Dict[str, str]],
        scenario_context: Optional[Dict[str, Any]] = None
    ) -> str:
        pass
    
    @abstractmethod
    async def handle_interruption(self, session_id: str) -> None:
        pass
    
    @abstractmethod
    async def cleanup_conversation(self, session_id: str) -> None:
        pass

class OpenAIConversationService(IAIConversationService):
    """OpenAI implementation of AI conversation service with role-playing"""
    
    def __init__(self):
        self.client = None
        self._session_contexts: Dict[str, Dict[str, Any]] = {}
    
    def _get_openai_client(self) -> OpenAI:
        """Get OpenAI client instance"""
        if self.client is None:
            api_key = os.getenv("OPENAI_API_KEY")
            if not api_key:
                raise ValueError("OPENAI_API_KEY not found in environment variables")
            self.client = OpenAI(api_key=api_key)
        return self.client
    
    async def initialize_conversation(
        self,
        session_id: str,
        scenario: ConversationScenario,
        messages: List[ConversationMessage]
    ) -> None:
        """Initialize conversation context for role-playing"""
        # Build dynamic system prompt based on scenario
        system_prompt = self._build_role_playing_prompt(scenario, messages)
        
        # Initialize conversation history
        conversation_history = []
        
        # Add system prompt
        conversation_history.append({
            "role": "system",
            "content": system_prompt
        })
        
        # Add sample conversation as context
        for msg in messages:
            if msg.speaker == "user":
                conversation_history.append({
                    "role": "user",
                    "content": msg.message
                })
            else:
                conversation_history.append({
                    "role": "assistant",
                    "content": msg.message
                })
        
        # Store session context
        self._session_contexts[session_id] = {
            "scenario": scenario,
            "conversation_history": conversation_history,
            "turn_count": len(messages),
            "interrupted": False,
            "adaptation_notes": []
        }
        
        logger.info(f"Initialized AI conversation for session: {session_id}")
    
    async def generate_response(
        self,
        session_id: str,
        user_message: str,
        conversation_context: List[Dict[str, str]],
        scenario_context: Optional[Dict[str, Any]] = None
    ) -> str:
        """Generate AI response with role-playing and adaptation using enhanced context"""
        if session_id not in self._session_contexts:
            if scenario_context:
                # Initialize with provided scenario context
                await self._initialize_from_context(session_id, scenario_context)
            else:
                raise ValueError(f"Session {session_id} not initialized")
        
        context = self._session_contexts[session_id]
        scenario = context["scenario"]
        
        # Use provided conversation context or maintain internal history
        if conversation_context:
            # Create fresh conversation history with updated context
            messages = [context["conversation_history"][0]]  # Keep system prompt
            messages.extend(conversation_context)
            messages.append({"role": "user", "content": user_message})
        else:
            # Use internal history
            conversation_history = context["conversation_history"]
            conversation_history.append({"role": "user", "content": user_message})
            messages = conversation_history
        
        # Generate contextual adaptation based on scenario and conversation
        if scenario_context:
            adaptation_prompt = self._generate_enhanced_adaptation_prompt(
                user_message,
                conversation_context,
                scenario_context,
                context["adaptation_notes"]
            )
        else:
            adaptation_prompt = self._generate_adaptation_prompt(
                user_message,
                [],  # Convert to old format for backward compatibility
                scenario,
                context["adaptation_notes"]
            )
        
        # Update system message with adaptation
        if adaptation_prompt:
            messages[0] = {
                "role": "system", 
                "content": messages[0]["content"] + f"\n\n{adaptation_prompt}"
            }
        
        try:
            # Generate response using OpenAI
            client = self._get_openai_client()
            response = await asyncio.to_thread(
                client.chat.completions.create,
                model="gpt-4o-mini",
                messages=messages[-12:],  # Limit context to last 12 messages for efficiency
                max_tokens=150,  # Optimized for conversation flow
                temperature=0.8,  # Higher temperature for more natural conversation
                presence_penalty=0.1,
                frequency_penalty=0.1
            )
            
            ai_response = response.choices[0].message.content.strip()
            
            # Update internal context
            if not conversation_context:
                context["conversation_history"].append({
                    "role": "assistant",
                    "content": ai_response
                })
            
            context["turn_count"] += 1
            context["interrupted"] = False
            
            # Analyze user progress for future adaptations
            self._analyze_user_progress_enhanced(
                user_message, 
                ai_response, 
                context, 
                scenario_context
            )
            
            logger.info(f"Generated AI response for session: {session_id}")
            return ai_response
            
        except Exception as e:
            logger.error(f"AI response generation failed: {e}")
            scenario_fallback = scenario_context or context["scenario"]
            return self._get_fallback_response(scenario_fallback)
    
    async def handle_interruption(self, session_id: str) -> None:
        """Handle user interruption of AI speaking"""
        if session_id in self._session_contexts:
            context = self._session_contexts[session_id]
            context["interrupted"] = True
            context["adaptation_notes"].append("User tends to interrupt - adjust response length")
            logger.info(f"Handled interruption for session: {session_id}")
    
    async def cleanup_conversation(self, session_id: str) -> None:
        """Cleanup conversation context"""
        if session_id in self._session_contexts:
            del self._session_contexts[session_id]
            logger.info(f"Cleaned up AI conversation for session: {session_id}")
    
    def _build_role_playing_prompt(
        self,
        scenario: ConversationScenario,
        messages: List[ConversationMessage]
    ) -> str:
        """Build dynamic system prompt for role-playing"""
        base_prompt = f"""You are {scenario.ai_character_name}, {scenario.ai_character_description}

SCENARIO CONTEXT:
{scenario.description}

YOUR ROLE:
{scenario.ai_system_prompt}

CONVERSATION OBJECTIVES:
"""
        
        for i, objective in enumerate(scenario.learning_objectives, 1):
            base_prompt += f"{i}. {objective}\n"
        
        base_prompt += f"""
KEY VOCABULARY TO ENCOURAGE: {', '.join(scenario.key_vocabulary)}
KEY PHRASES TO ENCOURAGE: {', '.join(scenario.key_phrases)}

CONVERSATION GUIDELINES:
1. Stay completely in character as {scenario.ai_character_name}
2. Keep responses conversational and natural (2-3 sentences max)
3. Encourage use of key vocabulary and phrases naturally
4. Adapt your language level to match the user's proficiency
5. If user makes grammar mistakes, gently model correct usage without explicitly correcting
6. Keep the conversation flowing toward the learning objectives
7. Be patient and supportive with beginners
8. Challenge advanced learners appropriately
9. Use natural conversation fillers and expressions
10. Respond in English unless the scenario specifically requires otherwise

CONVERSATION SETTING: {scenario.topic.value.replace('_', ' ').title()}
USER LEVEL: {scenario.level.value.title()}

Remember: You are having a real conversation, not teaching a lesson. Be natural, engaging, and stay in character!
"""
        
        return base_prompt
    
    def _generate_adaptation_prompt(
        self,
        user_message: str,
        conversation_context: List[ConversationMessage],
        scenario: ConversationScenario,
        adaptation_notes: List[str]
    ) -> str:
        """Generate adaptation instructions based on user's performance"""
        adaptations = []
        
        # Analyze message length and complexity
        if len(user_message.split()) < 5:
            adaptations.append("User gives short responses - ask engaging follow-up questions")
        elif len(user_message.split()) > 20:
            adaptations.append("User is verbose - you can use more complex language")
        
        # Check grammar complexity
        if any(word in user_message.lower() for word in ["because", "although", "however", "therefore"]):
            adaptations.append("User uses complex grammar - you can increase language complexity")
        
        # Check vocabulary level
        advanced_words = ["consequently", "furthermore", "nevertheless", "significantly"]
        if any(word in user_message.lower() for word in advanced_words):
            adaptations.append("User demonstrates advanced vocabulary - use sophisticated language")
        
        # Apply previous adaptation notes
        adaptations.extend(adaptation_notes[-3:])  # Last 3 adaptation notes
        
        if adaptations:
            return "DYNAMIC ADAPTATION: " + " | ".join(adaptations)
        
        return ""
    
    def _analyze_user_progress(
        self,
        user_message: str,
        ai_response: str,
        context: Dict[str, Any]
    ) -> None:
        """Analyze user progress and update adaptation notes"""
        adaptation_notes = context["adaptation_notes"]
        
        # Check if user is using target vocabulary
        scenario = context["scenario"]
        vocabulary_used = [
            vocab for vocab in scenario.key_vocabulary
            if vocab.lower() in user_message.lower()
        ]
        
        if vocabulary_used:
            adaptation_notes.append(f"User successfully used: {', '.join(vocabulary_used)}")
        
        # Check conversation flow
        if context["turn_count"] > 5 and len(user_message.split()) > 10:
            adaptation_notes.append("User becoming more comfortable - can introduce new vocabulary")
        
        # Limit adaptation notes to prevent memory bloat
        if len(adaptation_notes) > 10:
            context["adaptation_notes"] = adaptation_notes[-10:]
    
    def _get_fallback_response(self, scenario: ConversationScenario) -> str:
        """Get fallback response when AI generation fails"""
        fallback_responses = {
            "restaurant": "I'm sorry, could you repeat that? What would you like to order today?",
            "shopping": "Excuse me, I didn't quite catch that. How can I help you find something?",
            "job_interview": "I apologize, could you please rephrase your question?",
            "travel": "I'm sorry, I didn't understand. Where are you planning to go?",
            "business_meeting": "Could you please repeat that? I want to make sure I understand.",
            "medical_appointment": "I'm sorry, could you say that again? I want to help you properly.",
            "education": "I didn't quite get that. Could you explain it differently?",
            "friendship": "Sorry, what was that? I want to understand what you're saying.",
            "family": "I missed that. Could you tell me again?",
            "hobbies": "I didn't catch that. What were you saying about your interests?"
        }
        
        if hasattr(scenario, 'topic'):
            return fallback_responses.get(
                scenario.topic.value if hasattr(scenario.topic, 'value') else str(scenario.topic),
                "I'm sorry, I didn't understand. Could you please repeat that?"
            )
        else:
            return "I'm sorry, I didn't understand. Could you please repeat that?"
    
    async def _initialize_from_context(
        self,
        session_id: str,
        scenario_context: Dict[str, Any]
    ) -> None:
        """Initialize session from scenario context"""
        # Create a minimal scenario object from context
        class MinimalScenario:
            def __init__(self, context):
                self.ai_character_name = context.get("character_name", "Assistant")
                self.ai_character_description = context.get("character_description", "A helpful AI assistant")
                self.ai_system_prompt = context.get("system_prompt", "You are a helpful AI assistant.")
                self.description = f"Learning conversation about {context.get('topic', 'general topics')}"
                self.learning_objectives = context.get("learning_objectives", [])
                self.key_vocabulary = []
                self.key_phrases = context.get("key_phrases", [])
                self.topic = type('Topic', (), {'value': context.get("topic", "general")})()
                self.level = type('Level', (), {'value': context.get("level", "intermediate")})()
        
        scenario = MinimalScenario(scenario_context)
        
        # Build system prompt
        system_prompt = self._build_role_playing_prompt(scenario, [])
        
        # Initialize conversation context
        self._session_contexts[session_id] = {
            "scenario": scenario,
            "conversation_history": [{"role": "system", "content": system_prompt}],
            "turn_count": 0,
            "interrupted": False,
            "adaptation_notes": []
        }
    
    def _generate_enhanced_adaptation_prompt(
        self,
        user_message: str,
        conversation_context: List[Dict[str, str]],
        scenario_context: Dict[str, Any],
        adaptation_notes: List[str]
    ) -> str:
        """Generate enhanced adaptation instructions"""
        adaptations = []
        
        # Analyze conversation length and engagement
        if len(conversation_context) > 6:
            adaptations.append("User is engaged - maintain conversation flow")
        
        # Analyze message complexity
        word_count = len(user_message.split())
        if word_count < 3:
            adaptations.append("User giving very short responses - ask engaging questions to encourage longer responses")
        elif word_count > 25:
            adaptations.append("User is comfortable with longer responses - you can provide more detailed responses")
        
        # Check for key phrase usage
        key_phrases = scenario_context.get("key_phrases", [])
        used_phrases = [phrase for phrase in key_phrases if phrase.lower() in user_message.lower()]
        if used_phrases:
            adaptations.append(f"User successfully used key phrases: {', '.join(used_phrases)}")
        
        # Level-based adaptations
        level = scenario_context.get("level", "intermediate")
        if level == "beginner":
            adaptations.append("Keep language simple and encouraging for beginner level")
        elif level == "advanced":
            adaptations.append("Use sophisticated vocabulary and complex structures for advanced learner")
        
        # Topic-specific adaptations
        topic = scenario_context.get("topic", "general")
        if topic == "business_meeting":
            adaptations.append("Maintain professional tone appropriate for business context")
        elif topic == "restaurant":
            adaptations.append("Focus on food-related vocabulary and ordering interactions")
        
        # Apply previous adaptation notes
        adaptations.extend(adaptation_notes[-2:])  # Last 2 adaptation notes
        
        if adaptations:
            return "CONVERSATION ADAPTATION: " + " | ".join(adaptations)
        
        return ""
    
    def _analyze_user_progress_enhanced(
        self,
        user_message: str,
        ai_response: str,
        context: Dict[str, Any],
        scenario_context: Optional[Dict[str, Any]] = None
    ) -> None:
        """Enhanced analysis of user progress"""
        adaptation_notes = context["adaptation_notes"]
        
        if scenario_context:
            # Check vocabulary usage
            key_phrases = scenario_context.get("key_phrases", [])
            used_phrases = [phrase for phrase in key_phrases if phrase.lower() in user_message.lower()]
            
            if used_phrases:
                adaptation_notes.append(f"Successfully used: {', '.join(used_phrases)}")
            
            # Analyze engagement level
            if len(user_message.split()) > 15:
                adaptation_notes.append("High engagement - user providing detailed responses")
            
            # Check for learning progress
            learning_objectives = scenario_context.get("learning_objectives", [])
            if any(obj_word in user_message.lower() for obj in learning_objectives for obj_word in obj.lower().split()):
                adaptation_notes.append("User demonstrating awareness of learning objectives")
        
        # Grammar complexity analysis
        complex_patterns = ["because", "although", "however", "therefore", "furthermore"]
        if any(pattern in user_message.lower() for pattern in complex_patterns):
            adaptation_notes.append("User demonstrates complex grammar - can handle advanced structures")
        
        # Conversation flow analysis
        turn_count = context.get("turn_count", 0)
        if turn_count > 8:
            adaptation_notes.append("Extended conversation - user is comfortable and engaged")
        
        # Limit adaptation notes to prevent memory bloat
        if len(adaptation_notes) > 8:
            context["adaptation_notes"] = adaptation_notes[-8:]