import React, { useState, useEffect, useRef } from 'react';
import {
  Input, Button, Empty, message, Spin,
  Space, Typography, Tooltip
} from 'antd';
import {
  SearchOutlined, BulbOutlined,
  SoundOutlined, ZoomInOutlined, ZoomOutOutlined, ReloadOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { mindmapService } from '../../services/mindmapService';
import { conversationService } from '../../services/conversationService';
import './style.css';

const { Text, Title, Paragraph } = Typography;

const POPULAR_TOPICS = [
  { value: 'travel', label: '✈️ Du lịch (Travel)' },
  { value: 'job_interview', label: '💼 Phỏng vấn (Job Interview)' },
  { value: 'technology', label: '💻 Công nghệ (Technology)' },
  { value: 'food', label: '🍽️ Ẩm thực (Food)' },
  { value: 'business_meeting', label: '🏢 Cuộc họp (Business)' },
  { value: 'health', label: '🏥 Sức khỏe (Health)' },
  { value: 'daily_life', label: '🏠 Đời sống (Daily Life)' }
];

// Rich offline dictionary for instant response & robust fallback
const RICH_WORD_DICTIONARY = {
  travel: {
    root: 'Travel',
    definition: '/ˈtræv.əl/ (verb/noun) - Đi du lịch, du hành, khám phá thế giới',
    branches: [
      {
        title: '📖 Nghĩa & Phiên Âm',
        color: '#0284c7',
        nodes: [
          { en: '/ˈtræv.əl/', vi: 'Phát âm chuẩn quốc tế IPA', example: 'Practice saying: Travel with clear stress on first syllable.' },
          { en: 'Core Meaning', vi: 'Di chuyển từ nơi này đến nơi khác cho mục đích du lịch hay công tác', example: 'They travel abroad twice a year.' }
        ]
      },
      {
        title: '🌳 Họ Từ Vựng (Word Family)',
        color: '#2563eb',
        nodes: [
          { en: 'Traveler (noun)', vi: 'Khách du lịch, người lữ hành', example: 'The airport was packed with tired travelers.' },
          { en: 'Traveling (noun/adj)', vi: 'Việc đi lại / có tính dịch chuyển', example: 'Traveling broadens your horizons and perspective.' },
          { en: 'Travel-guide (noun)', vi: 'Cẩm nang hướng dẫn du lịch', example: 'She bought a comprehensive travel-guide for Japan.' },
          { en: 'Travelable (adj)', vi: 'Có thể đi lại / thông suốt', example: 'The mountain pass is now travelable after the storm.' }
        ]
      },
      {
        title: '🌿 Từ Đồng Nghĩa (Synonyms)',
        color: '#059669',
        nodes: [
          { en: 'Journey', vi: 'Chuyến hành trình dài', example: 'Life is a journey, not a destination.' },
          { en: 'Trip', vi: 'Chuyến đi ngắn (nghỉ ngơi, công tác)', example: 'Have a safe business trip to Singapore!' },
          { en: 'Voyage', vi: 'Chuyến hải trình hoặc thám hiểm đại dương', example: 'The Titanic embarked on its fateful maiden voyage.' },
          { en: 'Excursion', vi: 'Cuộc dã ngoại / du ngoạn ngắn ngày', example: 'We took a day excursion to the ancient village.' }
        ]
      },
      {
        title: '🍂 Từ Trái Nghĩa (Antonyms)',
        color: '#dc2626',
        nodes: [
          { en: 'Stay', vi: 'Ở lại, dừng chân', example: 'I prefer to stay home during holiday weekends.' },
          { en: 'Remain', vi: 'Duy trì ở một vị trí cố định', example: 'Please remain in your seat until the plane stops.' },
          { en: 'Settle down', vi: 'An cư, ổn định cuộc sống', example: 'After years of wandering, he decided to settle down.' }
        ]
      },
      {
        title: '💬 Cụm Từ & Mẫu Câu',
        color: '#d97706',
        nodes: [
          { en: 'Travel broadens the mind', vi: 'Đi một ngày đàng học một sàng khôn', example: 'As the proverb says, travel broadens the mind.' },
          { en: 'Travel light', vi: 'Mang hành lý gọn nhẹ', example: 'I always recommend traveling light to save baggage fees.' },
          { en: 'Off the beaten track', vi: 'Khám phá những nơi hoang sơ ít người tới', example: 'We love exploring quiet villages off the beaten track.' },
          { en: 'Safe travels!', vi: 'Chúc bạn có một chuyến đi thượng lộ bình an!', example: 'Goodbye and safe travels on your flight back!' }
        ]
      }
    ]
  },
  inspire: {
    root: 'Inspire',
    definition: '/ɪnˈspaɪər/ (verb) - Truyền cảm hứng, thôi thúc, gợi ý tưởng sáng tạo',
    branches: [
      {
        title: '📖 Nghĩa & Phiên Âm',
        color: '#0284c7',
        nodes: [
          { en: '/ɪnˈspaɪər/', vi: 'Phát âm chuẩn Anh-Mỹ', example: 'Pronounced with stress on the second syllable: in-SPIRE.' },
          { en: 'Definition', vi: 'Tác động tích cực lên tâm trí, thôi thúc ai đó hành động hoặc sáng tạo', example: 'Her perseverance inspired everyone on the team.' }
        ]
      },
      {
        title: '🌳 Họ Từ Vựng (Word Family)',
        color: '#2563eb',
        nodes: [
          { en: 'Inspiration (noun)', vi: 'Nguồn cảm hứng / Sự truyền cảm hứng', example: 'Nature has always been a primary source of inspiration for poets.' },
          { en: 'Inspirer (noun)', vi: 'Người truyền cảm hứng, người dẫn dắt', example: 'Great leaders act as continuous inspirers to their followers.' },
          { en: 'Inspiring (adj)', vi: 'Đầy cảm hứng, gây xúc động mãnh liệt', example: 'The CEO delivered a deeply inspiring keynote speech.' },
          { en: 'Inspirational (adj)', vi: 'Mang tính khích lệ, thúc đẩy tinh thần', example: 'She wrote several bestselling inspirational books.' },
          { en: 'Inspiringly (adv)', vi: 'Một cách đầy nhiệt huyết và cảm hứng', example: 'He spoke inspiringly about the future of renewable energy.' }
        ]
      },
      {
        title: '🌿 Từ Đồng Nghĩa (Synonyms)',
        color: '#059669',
        nodes: [
          { en: 'Motivate', vi: 'Tạo động lực hành động', example: 'Rewards can effectively motivate employees.' },
          { en: 'Encourage', vi: 'Cổ vũ, khích lệ', example: 'Teachers should encourage students to think critically.' },
          { en: 'Stimulate', vi: 'Kích thích tư duy sáng tạo', example: 'Challenging puzzles stimulate brain activity.' }
        ]
      },
      {
        title: '🍂 Từ Trái Nghĩa (Antonyms)',
        color: '#dc2626',
        nodes: [
          { en: 'Discourage', vi: 'Làm nản lòng, thoái chí', example: 'Do not let early setbacks discourage your dreams.' },
          { en: 'Dishearten', vi: 'Làm mất tinh thần', example: 'The difficult exam disheartened many applicants.' },
          { en: 'Deter', vi: 'Ngăn cản, làm chùn bước', example: 'Bad weather could not deter them from hiking.' }
        ]
      },
      {
        title: '💬 Cụm Từ & Mẫu Câu',
        color: '#d97706',
        nodes: [
          { en: 'Draw inspiration from', vi: 'Lấy nguồn cảm hứng từ điều gì', example: 'Architects often draw inspiration from natural organic shapes.' },
          { en: 'Endless inspiration', vi: 'Nguồn cảm hứng bất tận', example: 'Her dedication serves as endless inspiration for us all.' },
          { en: 'Flash of inspiration', vi: 'Ý tưởng lóe sáng bất chợt', example: 'A sudden flash of inspiration solved the technical dilemma.' }
        ]
      }
    ]
  },
  success: {
    root: 'Success',
    definition: '/səkˈses/ (noun) - Sự thành công, thành tựu rực rỡ',
    branches: [
      {
        title: '📖 Nghĩa & Phiên Âm',
        color: '#0284c7',
        nodes: [
          { en: '/səkˈses/', vi: 'Phát âm chuẩn (âm đầu /sək/, trọng âm âm 2 /ses/)', example: 'Stress falls firmly on the second syllable: suc-CESS.' },
          { en: 'Definition', vi: 'Đạt được mục tiêu mong muốn hoặc tạo ra kết quả xuất sắc', example: 'Hard work is the cornerstone of genuine success.' }
        ]
      },
      {
        title: '🌳 Họ Từ Vựng (Word Family)',
        color: '#2563eb',
        nodes: [
          { en: 'Succeed (verb)', vi: 'Thành công / Kế thừa chức vụ', example: 'If at first you don’t succeed, try and try again.' },
          { en: 'Successful (adj)', vi: 'Thành công, có kết quả tốt', example: 'The startup completed a highly successful funding round.' },
          { en: 'Successfully (adv)', vi: 'Một cách thành công, mỹ mãn', example: 'The engineering team successfully deployed the project.' },
          { en: 'Successor (noun)', vi: 'Người kế nhiệm, kế vị', example: 'He was named as the successor to the company chairman.' },
          { en: 'Succession (noun)', vi: 'Sự kế tiếp, chuỗi liên tiếp', example: 'A succession of breakthroughs led to the new discovery.' }
        ]
      },
      {
        title: '🌿 Từ Đồng Nghĩa (Synonyms)',
        color: '#059669',
        nodes: [
          { en: 'Achievement', vi: 'Thành tích, thành tựu lớn', example: 'Publishing her thesis was a monumental achievement.' },
          { en: 'Triumph', vi: 'Chiến thắng vẻ vang', example: 'Their victory at the finals was a sensational triumph.' },
          { en: 'Prosperity', vi: 'Sự thịnh vượng, phát đạt', example: 'Economic reforms brought newfound prosperity to the region.' }
        ]
      },
      {
        title: '🍂 Từ Trái Nghĩa (Antonyms)',
        color: '#dc2626',
        nodes: [
          { en: 'Failure', vi: 'Sự thất bại, đổ vỡ', example: 'Failure is merely an opportunity to begin again more intelligently.' },
          { en: 'Defeat', vi: 'Sự thua cuộc, thất trận', example: 'They refused to accept defeat and kept practicing.' },
          { en: 'Setback', vi: 'Bước lùi, sự gián đoạn', example: 'A minor budget setback will not derail the entire project.' }
        ]
      },
      {
        title: '💬 Cụm Từ & Mẫu Câu',
        color: '#d97706',
        nodes: [
          { en: 'Key to success', vi: 'Chìa khóa dẫn tới thành công', example: 'Consistency and discipline are the true keys to success.' },
          { en: 'Resounding success', vi: 'Thành công vang dội', example: 'The annual international exhibition was a resounding success.' },
          { en: 'Climb the ladder of success', vi: 'Từng bước thăng tiến sự nghiệp', example: 'She climbed the ladder of success through unmatched diligence.' }
        ]
      }
    ]
  },
  leadership: {
    root: 'Leadership',
    definition: '/ˈliː.dər.ʃɪp/ (noun) - Khả năng lãnh đạo, cương vị dẫn dắt',
    branches: [
      {
        title: '📖 Nghĩa & Phiên Âm',
        color: '#0284c7',
        nodes: [
          { en: '/ˈliː.dər.ʃɪp/', vi: 'Phát âm chuẩn (trọng âm âm 1)', example: 'Practice pronunciation: LEAD-er-ship.' },
          { en: 'Definition', vi: 'Kỹ năng định hướng, truyền cảm hứng và dẫn dắt một tập thể', example: 'Effective leadership inspires teams to achieve greatness.' }
        ]
      },
      {
        title: '🌳 Họ Từ Vựng (Word Family)',
        color: '#2563eb',
        nodes: [
          { en: 'Lead (verb/noun)', vi: 'Dẫn dắt, chỉ đạo / Vị trí dẫn đầu', example: 'A good captain knows how to lead by personal example.' },
          { en: 'Leader (noun)', vi: 'Người lãnh đạo, chỉ huy', example: 'An empathetic leader listens actively to team members.' },
          { en: 'Leading (adj)', vi: 'Hàng đầu, dẫn đầu thị trường', example: 'They are the leading technology firm in the continent.' },
          { en: 'Leadable (adj)', vi: 'Dễ dẫn dắt, biết lắng nghe', example: 'Passionate and open-minded youth are highly leadable.' }
        ]
      },
      {
        title: '🌿 Từ Đồng Nghĩa (Synonyms)',
        color: '#059669',
        nodes: [
          { en: 'Guidance', vi: 'Sự định hướng, dìu dắt', example: 'Under her expert guidance, the company prospered.' },
          { en: 'Management', vi: 'Sự quản lý, điều hành', example: 'Modern management focuses on empowering employees.' },
          { en: 'Direction', vi: 'Phương hướng chỉ đạo', example: 'Clear strategic direction eliminates confusion.' }
        ]
      },
      {
        title: '🍂 Từ Trái Nghĩa (Antonyms)',
        color: '#dc2626',
        nodes: [
          { en: 'Followership', vi: 'Vị thế người đi theo', example: 'Good followership is just as vital as good leadership.' },
          { en: 'Subordination', vi: 'Sự phụ thuộc cấp dưới', example: 'Strict subordination can stifle innovative initiatives.' },
          { en: 'Mismanagement', vi: 'Sự quản lý yếu kém, sai hướng', example: 'Mismanagement drove the prominent firm into bankruptcy.' }
        ]
      },
      {
        title: '💬 Cụm Từ & Mẫu Câu',
        color: '#d97706',
        nodes: [
          { en: 'Lead by example', vi: 'Lãnh đạo bằng cách nêu gương', example: 'Executives must lead by example to earn genuine respect.' },
          { en: 'Leadership skills', vi: 'Kỹ năng lãnh đạo', example: 'Communication and empathy are crucial leadership skills.' },
          { en: 'Demonstrate leadership', vi: 'Thể hiện bản lĩnh dẫn dắt', example: 'He demonstrated outstanding leadership during the crisis.' }
        ]
      }
    ]
  }
};

// Smart morphological generator for arbitrary words
function buildDynamicWordFamily(word) {
  const clean = word.trim();
  const cap = clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
  const root = clean.toLowerCase();

  // Morphological rules
  let nounPerson = `${cap}er`;
  let nounAbstract = `${cap}ion`;
  let adjForm = `${cap}ive`;
  let advForm = `${cap}ively`;
  let verbForm = cap;

  if (root.endsWith('e')) {
    const base = cap.slice(0, -1);
    nounPerson = `${base}er`;
    nounAbstract = `${base}ation`;
    adjForm = `${base}ative`;
    advForm = `${base}atively`;
  } else if (root.endsWith('y')) {
    const base = cap.slice(0, -1);
    nounAbstract = `${base}ication`;
    adjForm = `${base}iful`;
    advForm = `${base}ily`;
  } else if (root.endsWith('te') || root.endsWith('t')) {
    const base = root.endsWith('te') ? cap.slice(0, -2) : cap.slice(0, -1);
    nounAbstract = `${base}tion`;
    adjForm = `${base}tive`;
    advForm = `${base}tively`;
  }

  return {
    root: cap,
    definition: `/${root}/ - Từ vựng tiếng Anh chủ đề '${cap}'`,
    branches: [
      {
        title: '📖 Nghĩa & Phiên Âm',
        color: '#0284c7',
        nodes: [
          { en: `/${root}/`, vi: `Phát âm tiếng Anh chuẩn của '${root}'`, example: `Listen and practice pronouncing ${root} with native intonation.` },
          { en: 'Core Meaning', vi: `Ý nghĩa trọng tâm và cách dùng chuẩn của '${cap}'`, example: `Understanding the root ${root} helps unlock many derived words.` }
        ]
      },
      {
        title: '🌳 Họ Từ Vựng (Word Family)',
        color: '#2563eb',
        nodes: [
          { en: `${verbForm} (verb)`, vi: `Động từ gốc: thực hiện hành động liên quan đến ${root}`, example: `They decided to ${root} to achieve higher productivity.` },
          { en: `${nounPerson} (noun)`, vi: `Danh từ chỉ người/chủ thể thực hiện ${root}`, example: `The ${nounPerson.toLowerCase()} was recognized for outstanding contributions.` },
          { en: `${nounAbstract} (noun)`, vi: `Danh từ trừu tượng: sự/quá trình ${root}`, example: `The ${nounAbstract.toLowerCase()} played a vital role in their ultimate victory.` },
          { en: `${adjForm} (adj)`, vi: `Tính từ mô tả đặc tính liên quan đến ${root}`, example: `They adopted a very ${adjForm.toLowerCase()} approach to modern challenges.` },
          { en: `${advForm} (adv)`, vi: `Trạng từ: một cách ${adjForm.toLowerCase()}`, example: `The team executed the entire workflow ${advForm.toLowerCase()}.` }
        ]
      },
      {
        title: '🌿 Từ Đồng Nghĩa (Synonyms)',
        color: '#059669',
        nodes: [
          { en: `Related concept of ${cap}`, vi: `Khái niệm ngữ nghĩa tương đương với '${cap}'`, example: `Contextual synonyms enrich your expressive vocabulary range.` },
          { en: `Core synonym for ${cap}`, vi: `Từ vựng cùng trường nghĩa thông dụng`, example: `Using diverse synonyms prevents monotonous repetition in writing.` }
        ]
      },
      {
        title: '🍂 Từ Trái Nghĩa (Antonyms)',
        color: '#dc2626',
        nodes: [
          { en: `Opposite of ${cap}`, vi: `Khái niệm đối lập trực tiếp với '${cap}'`, example: `Contrast helps clarify the exact boundaries of the word.` }
        ]
      },
      {
        title: '💬 Cụm Từ & Mẫu Câu',
        color: '#d97706',
        nodes: [
          { en: `In terms of ${root}`, vi: `Xét về khía cạnh ${root}`, example: `In terms of ${root}, the project exceeded every benchmark.` },
          { en: `Mastering ${root}`, vi: `Làm chủ và ứng dụng ${root} trong giao tiếp`, example: `Mastering ${root} empowers your natural English fluency.` }
        ]
      }
    ]
  };
}

// Universal normalizer for all backend schemas
export function normalizeMindmapData(raw, fallbackWord = '') {
  if (!raw) return null;

  // 1. If already structured in { root, branches } where branches have nodes
  if (raw.root && Array.isArray(raw.branches) && raw.branches.length > 0 && raw.branches[0].nodes) {
    return raw;
  }

  const rootText = raw.root || raw.label || fallbackWord || 'English';
  const definition = raw.definition || '';

  // 2. If tree structure with children (Python FastAPI / Gemini schema)
  const rawBranches = raw.children || raw.branches || [];

  const categoryConfig = [
    { match: ['meaning', 'nghĩa', 'phát âm', 'ipa'], title: '📖 Nghĩa & Phiên Âm', color: '#0284c7' },
    { match: ['family', 'gia đình', 'họ từ'], title: '🌳 Họ Từ Vựng (Word Family)', color: '#2563eb' },
    { match: ['synonym', 'đồng nghĩa'], title: '🌿 Từ Đồng Nghĩa (Synonyms)', color: '#059669' },
    { match: ['antonym', 'trái nghĩa'], title: '🍂 Từ Trái Nghĩa (Antonyms)', color: '#dc2626' },
    { match: ['phrase', 'collocation', 'cụm từ', 'thông dụng', 'mẫu câu', 'speaking'], title: '💬 Cụm Từ & Mẫu Câu', color: '#d97706' }
  ];

  const defaultColors = ['#0284c7', '#2563eb', '#059669', '#dc2626', '#d97706', '#7c3aed'];

  const branches = rawBranches.map((branchItem, bIdx) => {
    const rawTitle = branchItem.label || branchItem.title || `Nhánh ${bIdx + 1}`;
    const titleLower = rawTitle.toLowerCase();

    const matchedConfig = categoryConfig.find(cfg => cfg.match.some(m => titleLower.includes(m)));
    const title = matchedConfig ? matchedConfig.title : rawTitle;
    const color = branchItem.color || (matchedConfig ? matchedConfig.color : defaultColors[bIdx % defaultColors.length]);

    const rawNodes = branchItem.children || branchItem.nodes || [];

    const nodes = rawNodes.map(nodeItem => {
      if (nodeItem && typeof nodeItem === 'object' && nodeItem.en) {
        return {
          en: nodeItem.en,
          vi: nodeItem.vi || '',
          example: nodeItem.example || ''
        };
      }

      const text = typeof nodeItem === 'string' ? nodeItem : (nodeItem?.label || '');
      let en = text;
      let vi = '';
      let example = '';

      if (text.includes(' - ')) {
        const parts = text.split(' - ');
        en = parts[0].trim();
        const rest = parts.slice(1).join(' - ').trim();
        if (rest.includes(': ')) {
          const subParts = rest.split(': ');
          vi = subParts[0].trim();
          example = subParts.slice(1).join(': ').trim();
        } else {
          vi = rest;
        }
      } else if (text.includes(': ')) {
        const parts = text.split(': ');
        en = parts[0].trim();
        vi = parts.slice(1).join(': ').trim();
      }

      return {
        en: en || text,
        vi,
        example
      };
    });

    return {
      title,
      color,
      nodes
    };
  });

  return {
    root: rootText,
    definition,
    branches
  };
}

function Mindmap() {
  const { isLogin } = useSelector((state) => state.auth);
  const [searchTerm, setSearchTerm] = useState('travel');
  const [selectedTopic, setSelectedTopic] = useState('travel');
  const [data, setData] = useState(RICH_WORD_DICTIONARY['travel']);
  const [loading, setLoading] = useState(false);
  const [apiTopics, setApiTopics] = useState([]);
  const [zoomLevel, setZoomLevel] = useState(1);

  const scrollRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Load topics
  useEffect(() => {
    const loadTopics = async () => {
      try {
        const response = await conversationService.getTopics();
        if (response.success && response.data?.length > 0) {
          setApiTopics(response.data);
        }
      } catch (error) {
        console.error('Load topics error:', error);
      }
    };
    if (isLogin) {
      loadTopics();
    }
  }, [isLogin]);

  // Initial load default topic
  useEffect(() => {
    handleGenerateMindmap('travel');
  }, []);

  const handleGenerateMindmap = async (topicOrWord) => {
    const query = (topicOrWord || searchTerm || 'travel').trim();
    if (!query) return;

    try {
      setLoading(true);

      // Check rich local dictionary first for instant zero-latency experience
      const lowerQuery = query.toLowerCase();
      if (RICH_WORD_DICTIONARY[lowerQuery]) {
        setData(RICH_WORD_DICTIONARY[lowerQuery]);
        setLoading(false);
        return;
      }

      // Call API
      const res = await mindmapService.generateMindmap(query);
      if (res.success && res.data) {
        const normalized = normalizeMindmapData(res.data, query);
        if (normalized && normalized.branches && normalized.branches.length > 0) {
          setData(normalized);
          return;
        }
      }

      // Fallback to rich dynamic word family generator
      setData(buildDynamicWordFamily(query));
    } catch (e) {
      console.warn('Mindmap API fallback:', e);
      setData(buildDynamicWordFamily(query));
    } finally {
      setLoading(false);
    }
  };

  const speak = (text, e) => {
    if (e) e.stopPropagation();
    if (!text || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const cleanWord = text.split('(')[0].split('/')[0].trim();
    const utterance = new SpeechSynthesisUtterance(cleanWord);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  // Drag to scroll
  const onMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };
  const onMouseLeave = () => setIsDragging(false);
  const onMouseUp = () => setIsDragging(false);
  const onMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  return (
    <div className="mindmap-page">
      <div className="mindmap-container">
        {/* Hero Section */}
        <div className="mindmap-header">
          <div className="mindmap-pill-badge">
            <BulbOutlined style={{ marginRight: 6 }} /> TỪ ĐIỂN TƯ DUY AI 2.0
          </div>
          <Title level={1} className="mindmap-title">
            Sơ Đồ Tư Duy Từ Vựng Thông Minh
          </Title>
          <Paragraph className="mindmap-subtitle">
            Học một từ, hiểu cả hệ thống. AI tự động phân rã họ từ, từ đồng nghĩa, trái nghĩa và mẫu câu ngữ cảnh chuẩn bản ngữ.
          </Paragraph>

          {/* Search Bar & Quick Topic Chips */}
          <div className="mindmap-search-card">
            <div className="search-bar-row">
              <Input
                size="large"
                placeholder="Nhập bất kỳ từ vựng hoặc chủ đề tiếng Anh nào (VD: Travel, Inspire, Success, Leadership...)"
                prefix={<SearchOutlined style={{ color: '#0072ff', fontSize: 18 }} />}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onPressEnter={() => handleGenerateMindmap(searchTerm)}
                className="mindmap-input"
              />
              <Button
                type="primary"
                size="large"
                icon={<ThunderboltOutlined />}
                loading={loading}
                onClick={() => handleGenerateMindmap(searchTerm)}
                className="btn-generate-mindmap"
              >
                Tạo Sơ Đồ AI
              </Button>
            </div>

            <div className="mindmap-topics-chips">
              <Text strong style={{ color: '#64748b', fontSize: 13, marginRight: 8 }}>Chủ đề gợi ý:</Text>
              {POPULAR_TOPICS.map(item => (
                <button
                  key={item.value}
                  type="button"
                  className={`topic-chip ${selectedTopic === item.value ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedTopic(item.value);
                    setSearchTerm(item.value);
                    handleGenerateMindmap(item.value);
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Mindmap Canvas Area */}
        <div className="mindmap-canvas-card">
          <div className="canvas-toolbar">
            <div className="toolbar-hint">
              <span>💡 Kéo chuột để di chuyển canvas • Nhấn loa để nghe phát âm</span>
            </div>
            <Space>
              <Tooltip title="Phóng to">
                <Button icon={<ZoomInOutlined />} onClick={() => setZoomLevel(prev => Math.min(prev + 0.1, 1.4))} />
              </Tooltip>
              <Tooltip title="Thu nhỏ">
                <Button icon={<ZoomOutOutlined />} onClick={() => setZoomLevel(prev => Math.max(prev - 0.1, 0.7))} />
              </Tooltip>
              <Tooltip title="Mặc định">
                <Button icon={<ReloadOutlined />} onClick={() => setZoomLevel(1)}>100%</Button>
              </Tooltip>
            </Space>
          </div>

          {loading ? (
            <div className="mindmap-loading-box">
              <Spin size="large" tip="AI đang phân rã và xây dựng cây ngữ nghĩa..." />
            </div>
          ) : !data ? (
            <Empty description="Hãy chọn một chủ đề hoặc nhập từ vựng để bắt đầu" />
          ) : (
            <div
              className={`tree-viewport ${isDragging ? 'is-dragging' : ''}`}
              ref={scrollRef}
              onMouseDown={onMouseDown}
              onMouseLeave={onMouseLeave}
              onMouseUp={onMouseUp}
              onMouseMove={onMouseMove}
            >
              <div
                className="tree-canvas"
                style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
              >
                {/* ROOT NODE WITH DEFINITION */}
                <div className="tree-root-wrapper">
                  <div className="tree-root-node" onClick={(e) => speak(data.root || searchTerm, e)}>
                    <span className="root-sparkle">⚡</span>
                    <span className="root-text">{data.root || searchTerm}</span>
                    <SoundOutlined className="root-sound" />
                  </div>
                  {data.definition && (
                    <div className="tree-root-definition">
                      <span>{data.definition}</span>
                    </div>
                  )}
                </div>

                {/* BRANCHES */}
                <div className="tree-branches-container">
                  {data.branches && data.branches.map((branch, bIdx) => (
                    <div key={bIdx} className="tree-branch-column">
                      <div className="branch-category-pill" style={{ borderColor: branch.color, color: branch.color }}>
                        {branch.title}
                      </div>

                      <div className="branch-leaves-list">
                        {branch.nodes && branch.nodes.map((leaf, lIdx) => (
                          <div
                            key={lIdx}
                            className="leaf-card"
                            onClick={(e) => speak(leaf.en, e)}
                          >
                            <div className="leaf-top-row">
                              <span className="leaf-en">{leaf.en}</span>
                              <SoundOutlined className="leaf-sound-icon" />
                            </div>
                            {leaf.vi && <div className="leaf-vi">{leaf.vi}</div>}
                            {leaf.example && (
                              <div className="leaf-example">"{leaf.example}"</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Mindmap;
