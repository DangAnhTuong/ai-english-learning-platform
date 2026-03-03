import requests
from threading import Thread
import random
import time
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# Cấu hình
URL = "https://vacba1.com/api/predict-file?threshold=0.5"
FILE_PATH = "test.png"
THREAD_COUNT = 10  # Giảm xuống để test nhẹ hơn
MAX_RETRIES = 3
TIMEOUT = 30  # Tăng timeout lên 30s

# Test URLs khác để so sánh
TEST_URLS = [
    "https://httpbin.org/post",  # Test API miễn phí
    "https://jsonplaceholder.typicode.com/posts",  # Test API khác
    "https://vacba1.com/api/predict-file?threshold=0.5"  # URL gốc
]

def create_session():
    """Tạo session với retry strategy"""
    session = requests.Session()
    retry_strategy = Retry(
        total=MAX_RETRIES,
        backoff_factor=1,
        status_forcelist=[429, 500, 502, 503, 504],
    )
    adapter = HTTPAdapter(max_retries=retry_strategy)
    session.mount("http://", adapter)
    session.mount("https://", adapter)
    return session

def upload(session, thread_id):
    try:
        # Kiểm tra file có tồn tại không
        import os
        if not os.path.exists(FILE_PATH):
            print(f"Thread {thread_id}: File {FILE_PATH} not found!")
            return False
            
        # Kiểm tra kích thước file
        file_size = os.path.getsize(FILE_PATH)
        print(f"Thread {thread_id}: File size: {file_size} bytes")
        
        with open(FILE_PATH, 'rb') as f:
            files = {'file': f}
            # Giả mạo IP với X-Forwarded-For
            headers = {
                'X-Forwarded-For': f"{random.randint(1, 255)}.{random.randint(1, 255)}.{random.randint(1, 255)}.{random.randint(1, 255)}",
                'User-Agent': f'StressTest-{thread_id}'
            }
            print(f"Thread {thread_id}: Sending request to {URL}")
            response = session.post(URL, files=files, headers=headers, timeout=TIMEOUT)
            print(f"Thread {thread_id}: Status {response.status_code}, Time: {response.elapsed.total_seconds():.2f}s")
            
            # In response content nếu có lỗi
            if response.status_code != 200:
                print(f"Thread {thread_id}: Response content: {response.text[:200]}...")
            
            return response.status_code == 200
    except Exception as e:
        print(f"Thread {thread_id}: Error: {e}")
        return False

def run_stress_test():
    print(f"Starting stress test with {THREAD_COUNT} threads...")
    print(f"Timeout: {TIMEOUT}s, Max retries: {MAX_RETRIES}")
    
    start_time = time.time()
    threads = []
    results = []
    
    # Tạo session cho mỗi thread
    sessions = [create_session() for _ in range(THREAD_COUNT)]
    
    for i in range(THREAD_COUNT):
        t = Thread(target=lambda i=i: results.append(upload(sessions[i], i)))
        threads.append(t)
        t.start()
        # Thêm delay nhỏ giữa các request để tránh spam
        time.sleep(0.1)
    
    for t in threads:
        t.join()
    
    end_time = time.time()
    success_count = sum(results)
    
    print(f"\n=== RESULTS ===")
    print(f"Total time: {end_time - start_time:.2f}s")
    print(f"Successful requests: {success_count}/{THREAD_COUNT}")
    print(f"Success rate: {success_count/THREAD_COUNT*100:.1f}%")

def test_server_connectivity():
    """Test kết nối đến các server khác nhau"""
    print("=== TESTING SERVER CONNECTIVITY ===")
    session = create_session()
    
    for i, test_url in enumerate(TEST_URLS):
        print(f"\nTest {i+1}: {test_url}")
        try:
            if "httpbin.org" in test_url:
                # Test với httpbin (không cần file)
                response = session.get(test_url, timeout=10)
                print(f"  Status: {response.status_code}")
                print(f"  Response type: {type(response.json())}")
            elif "jsonplaceholder" in test_url:
                # Test với jsonplaceholder
                response = session.get(test_url, timeout=10)
                print(f"  Status: {response.status_code}")
                print(f"  Response type: {type(response.json())}")
            else:
                # Test với vacba1.com
                with open(FILE_PATH, 'rb') as f:
                    files = {'file': f}
                    response = session.post(test_url, files=files, timeout=10)
                    print(f"  Status: {response.status_code}")
                    print(f"  Response content preview: {response.text[:100]}...")
        except Exception as e:
            print(f"  Error: {e}")

def test_single_request():
    """Test một request đơn lẻ trước khi chạy stress test"""
    print("=== TESTING SINGLE REQUEST ===")
    session = create_session()
    result = upload(session, 0)
    if result:
        print("Single request successful!")
        return True
    else:
        print("Single request failed!")
        return False

if __name__ == "__main__":
    # Test server connectivity trước
    test_server_connectivity()
    
    print("\n" + "="*50)
    # Test single request trước
    if test_single_request():
        print("\n" + "="*50)
        run_stress_test()
    else:
        print("Single request failed, skipping stress test.")