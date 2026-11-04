# Quy trình team

`dev` là nhánh mặc định được bảo vệ để chủ repo duyệt và là nguồn phát hành đã duyệt. `main` là nhánh làm việc của team.
Quyền ghi repo được cấp sau khi chủ repo mời từng GitHub username.

```powershell
git clone https://github.com/skunlainro3-glitch/TaskHub.git
cd TaskHub
git switch main
npm ci
npm run dev
```

Trước khi sửa, chạy `git pull --ff-only origin main`. Khi hoàn tất:

```powershell
npm test
npm run build
git add <cac-file-da-sua>
git commit -m "Mo ta thay doi"
git push origin main
```

Mở Pull Request: base **dev**, compare **main**. skunlainro3-glitch review và merge khi
CI đạt. Team không push thẳng vào `dev` và không force-push nhánh chung.
Trao đổi trước khi hai người sửa cùng một file; có thể dùng nhánh tính năng
riêng từ `main` để giảm xung đột.

Sau khi PR merge, đồng bộ `main` trước khi bắt đầu việc tiếp theo:

```powershell
git fetch origin
git switch main
git pull --ff-only origin main
git merge origin/dev
git push origin main
```

Không commit `.env`, database, dữ liệu khảo sát hoặc khóa tài khoản.
Mật khẩu trên web được cấu hình trong hosting, không nằm trong code.
