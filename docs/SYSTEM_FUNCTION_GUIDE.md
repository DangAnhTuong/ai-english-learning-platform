# Huong Dan Su Dung Chuc Nang He Thong

Tai lieu nay mo ta cac chuc nang chinh va luong hoat dong co ban cua he thong English Learning Platform theo vai tro su dung thuc te.

## 1. Phan loai vai tro

- **Khach/Guest**
  - Xem trang chu, danh sach khoa hoc cong khai, noi dung gioi thieu/chinh sach.
- **Nguoi hoc (da dang nhap)**
  - Su dung conversation, mindmap, chatbox AI, profile, my-courses.
- **Admin/Teacher**
  - Quan tri user, course, conversation, tu dien, topics/plans, dashboard.

## 2. Luong xac thuc tai khoan

### 2.1 Dang ky/Dang nhap

- Truy cap `login` hoac `register`.
- Dang nhap thanh cong -> frontend luu `accessToken` + `refreshToken`.
- Cac request Node API duoc gan `Authorization: Bearer ...` tu dong.
- Neu `accessToken` het han -> frontend tu dong goi refresh va retry request.

### 2.2 Dang xuat

- Truy cap `logout` hoac bam nut dang xuat.
- Token local bi xoa, quay ve man hinh chua dang nhap.

## 3. Conversation (nguoi hoc)

Trang: `conversation`

## 3.1 Chon bai hoi thoai de hoc

1. Chon **level**.
2. Chon **topic**.
3. Chon 1 scenario trong danh sach de vao man hinh nghe hoc.

Ket qua:

- He thong tang usage count cua conversation.
- Chuyen sang man hinh listen mode.

## 3.2 Nghe hoi thoai (listen mode)

Nguoi hoc co the:

- Phat tung cau (play line).
- Phat tat ca cau lien tuc (play all).
- Doi toc do phat (`0.5x` -> `1.5x`).
- Tai audio tung cau.

Luu y:

- Neu bai chua co audio thi UI se hien "Chua co audio".
- Play all duoc xu ly queue tung cau den khi ket thuc.

## 3.3 Luyen hoi thoai realtime (practice mode)

Nguoi hoc co the:

- Gui text cho AI.
- Bam mic de ghi am.
- Dung session khi can.

Ket qua:

- Tin nhan AI va user hien trong khung chat.
- Neu co audio URL trong message, nguoi hoc co the phat lai.

## 4. Quan tri hoi thoai va tao voice (Admin/Teacher)

Trang: `admin/teacher-modules` -> tab "Quan ly Hoi thoai"

## 4.1 Tao bai hoi thoai

1. Bam **Tao bai hoi thoai**.
2. Nhap thong tin: title, level, topic, participants.
3. Nhap tung cau hoi thoai trong form lines/sentences.
4. Bam **Luu bai hoc**.

Ket qua:

- Conversation duoc tao/cap nhat trong backend Node.
- Hien trong bang danh sach.

## 4.2 Generate voice cho hoi thoai

1. Tai bang conversation, bam icon `Sound`.
2. Mo modal cau hinh voice cho tung participant.
3. Xac nhan de queue qua trinh tao audio.
4. He thong polling status va cap nhat:
   - `queued` / `in_progress`
   - `completed` / `partial` / `failed`

Ket qua:

- Tung line co `audioUrl` se duoc phat trong man hinh hoc.
- Cot "Trang thai Audio" va "Audio" hien progress, so cau co audio.

## 4.3 Xem chi tiet hoi thoai

- Bam icon `Info` de mo modal chi tiet.
- Co the nghe tung line va kiem tra du lieu truoc khi publish su dung.

## 5. Quan ly tu dien (Admin/Teacher)

Trang: `admin/teacher-modules` -> tab "Quan ly Tu dien"

Chuc nang:

- Them tu moi.
- Sua tu.
- Xoa tu.
- Khai bao type, meaning, synonyms, word family.

Muc dich:

- Dong bo tu dien cho user tra cuu va hoc tu vung.

## 6. Mindmap (nguoi hoc)

Trang: `mindmap`

Co 2 cach su dung:

- **Tra tu**: nhap tu -> tim trong tu dien backend.
- **Tao mindmap AI**: nhap topic/chon topic -> goi AI generate.

Ket qua:

- Hien cay mindmap theo nhanh (category -> words).
- Neu khong tim thay trong tu dien thi fallback sang AI generation.

## 7. Chatbox AI (nguoi hoc)

Trang: `chatbox`

Chuc nang:

- Chat text voi AI.
- Ghi am mic -> transcribe -> do vao input.
- Gui tin nhan va nhan phan hoi AI.
- Xoa lich su chat.

Co che online/offline:

- Neu Python API online: dung AI response that.
- Neu API loi: dung fallback response de khong gian doan UX.

## 8. Khoa hoc (public + nguoi hoc)

Trang: `courses`, `courses/:courseId`, `my-courses`

## 8.1 Danh sach khoa hoc cong khai

- Loc theo category, level, difficulty, enrollment type.
- Tim kiem theo tu khoa.
- Phan trang.

## 8.2 Chi tiet khoa hoc

- Xem mo ta, metadata, rating, so hoc vien.
- Di vao chi tiet qua card "Xem chi tiet".

## 8.3 Khoa hoc cua toi

- Sau khi dang nhap, nguoi hoc theo doi khoa hoc da ghi danh.

## 9. Profile va hoc tap ca nhan

Trang: `profile`

Chuc nang:

- Xem/cap nhat thong tin ca nhan.
- Cap nhat muc tieu hoc tap, trinh do.
- Doi mat khau.
- Theo doi cac thong tin hoc tap tong hop.

## 10. Context Manager (Admin)

Trang: `admin/context`

Chuc nang:

- Quan ly **plans** (goi hoc): tao/sua/an.
- Quan ly **topics**: tao/sua/an.
- Du lieu dong bo truc tiep backend API.

## 11. Luong du lieu tong quan

### 11.1 Frontend -> Node API

- Auth, profile, courses, orders, subscriptions, vocabulary, levels, conversations metadata.
- Access token duoc inject tu dong.
- 401 tu dong refresh token.

### 11.2 Frontend -> Python API

- Realtime chat, whisper, pronunciation feedback, tts/voice.
- Chat service co co che retry sau khi refresh token (qua Node refresh endpoint).

### 11.3 Node API -> Python API

- Node service goi Python cho cac luong audio/conversation can backend AI.

## 12. Checklist test chuc nang co ban

## 12.1 User flow

- Dang nhap thanh cong.
- Vao `conversation` chon bai -> nghe duoc audio.
- Vao `chatbox` gui text + thu mic.
- Vao `mindmap` tra tu va tao theo topic.
- Vao `courses` loc/tim duoc khoa hoc.

## 12.2 Admin flow

- Vao `admin/teacher-modules` tao conversation moi.
- Generate audio thanh cong (status completed/partial).
- Them/sua/xoa tu dien.
- Vao `admin/context` tao/sua plans va topics.

## 13. Cac diem can luu y khi van hanh

- Secrets (API keys, SMTP, JWT, OAuth) phai duoc bao mat, rotate neu da lo.
- Neu Python API thieu `OPENAI_API_KEY`, cac tinh nang AI/TTS se loi ngay luc startup.
- Neu khong co audio trong conversation, can tao audio tu admin module truoc khi user hoc.
- Production nen gioi han expose ports backend truc tiep, uu tien di qua reverse proxy.

---

Neu can, co the bo sung them ban "User Manual theo vai tro" (hoc vien/giao vien/admin) voi anh chup man hinh tung buoc de training noi bo.
