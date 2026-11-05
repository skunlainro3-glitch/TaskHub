# Quy trình team

`main` là nhánh chính, mặc định và được bảo vệ; chỉ nhận thay đổi qua Pull Request có review và CI đạt. `dev` là nhánh làm việc của team, được push trực tiếp với quyền Write.
Quyền ghi repo được cấp sau khi chủ repo mời từng GitHub username.

```powershell
git clone --branch dev https://github.com/skunlainro3-glitch/TaskHub.git
cd TaskHub
git switch dev
npm ci
npm run dev
```

Trước khi sửa, chạy `git pull --ff-only origin dev`. Khi hoàn tất:

```powershell
npm test
npm run build
git add <cac-file-da-sua>
git commit -m "Mo ta thay doi"
git push origin dev
```

Mở Pull Request: base **main**, compare **dev**. skunlainro3-glitch review và merge khi
CI đạt. Team không push thẳng vào `main` và không force-push nhánh chung.
Trao đổi trước khi hai người sửa cùng một file; có thể dùng nhánh tính năng
riêng từ `dev` để giảm xung đột.

Sau khi PR merge, đồng bộ `dev` trước khi bắt đầu việc tiếp theo:

```powershell
git fetch origin
git switch dev
git pull --ff-only origin dev
git merge origin/main
git push origin dev
```

Không commit `.env`, database, dữ liệu khảo sát hoặc khóa tài khoản.
Mật khẩu trên web được cấu hình trong hosting, không nằm trong code.
