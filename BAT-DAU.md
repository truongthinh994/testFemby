# Mở TOEIC Master trên máy của bạn

Đây là bản chạy local: dữ liệu học lưu trên máy bạn; tài khoản và email được mô phỏng. Không cần tài khoản Supabase.

1. Cài [Node.js 24 LTS](https://nodejs.org/en/download) (có sẵn npm).
2. Giải nén toàn bộ gói vào một thư mục trên máy. Không chạy trực tiếp trong file ZIP.
3. Mở Terminal/PowerShell trong thư mục chứa `package.json`, chạy:

```powershell
npm ci
npm run local
```

Lần đầu cần Internet để tải thư viện. Chờ thông báo “TOEIC MASTER — BẢN LOCAL”, rồi mở http://127.0.0.1:3000 bằng Edge hoặc Chrome. Giữ cửa sổ Terminal đang chạy.

Tài khoản mẫu: `alice@example.test`

Mật khẩu mẫu: `Test-password-123`

Có thể đăng ký tài khoản thử mới. Liên kết xác nhận và khôi phục nằm trong “Hộp thư mô phỏng” trên giao diện, không gửi tới email thật.

Nhấn **Ctrl+C** để dừng. Lần sau mở lại bằng `npm run local` và đăng nhập lại; tiến độ vẫn còn trong `.local-demo/database`. Chỉ cần chạy `npm ci` lần đầu hoặc khi cập nhật thư viện.

Nếu cổng đang được sử dụng, xem cách đổi cổng trong `README.md`.

Địa chỉ `127.0.0.1` mở ứng dụng trên chính máy bạn. Mỗi người có dữ liệu riêng; bản này chưa đồng bộ giữa nhiều máy.

Gói chia sẻ gồm mã nguồn và audio mẫu, không bao gồm dữ liệu học, cấu hình bí mật, `node_modules` hay bản build của người gửi. Bản này đã được kiểm tra trên Windows, Edge và Chromium; chưa nghiệm thu trên macOS/Linux.

Nếu tải mã nguồn từ GitHub, chọn **Code → Download ZIP**, giải nén rồi làm các bước tương tự. GitHub lưu mã nguồn; để người khác chỉ bấm một đường link và dùng ngay, dự án cần được triển khai thành website với dịch vụ dữ liệu thật.
