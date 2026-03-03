from app.services.mindmap_service import generate_mindmap

def test_generate_mindmap():
    topic = "Technology"
    result = generate_mindmap(topic)
    assert result.nodes[0].label == topic
    assert len(result.nodes) > 1
    assert all(edge.source == "root" for edge in result.edges) 