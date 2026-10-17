# Thực hiện khảo sát MVP và chuẩn bị dữ liệu CP3

Ngày rà soát: 17/10/2026. Tài liệu vận hành cho nhóm; không phải kết quả khảo sát.

## Tuyển và hướng dẫn người thử

1. Nhóm ghi lại kênh tuyển, thời gian, tiêu chí và số người mời. Ưu tiên điều hành, Sales và quản lý doanh nghiệp lữ hành; ghi rõ người ngoài phân khúc. Mời trên 20 người để có dự phòng; PDF yêu cầu tối thiểu 20 cá nhân.
2. Gửi link https://taskhub-travel.pages.dev/. Mỗi người tự đăng ký bằng email, tự chọn vai trò/quy mô và đọc lời đồng ý. Email hiện chưa được xác minh; nhóm đối chiếu người tham gia thực tế.
3. Người thử tự nhập thông tin tour, chọn công khai, lưu; mở lại tour đổi lịch hoặc số khách đã giữ chỗ. Không cần thông tin khách hàng thật. Không gian của mỗi người tách biệt.
4. Mở Cổng khách hàng để xem thông tin vừa thay đổi. Trở lại Công việc, tạo việc gắn với tour và đổi trạng thái.
5. Mở Phản hồi MVP, đánh giá tính hữu ích của ba chức năng, độ dễ dùng, ý định sử dụng, mức sẵn sàng trả và ý kiến mở. Không hướng người thử chấm tích cực. Sau khi dùng bổ sung, người thử có thể cập nhật phản hồi.
6. Trong phỏng vấn bổ sung, hỏi rõ từng tính năng có được dùng trong công việc không, vì sao và điểm không thích. Form hiện thu điểm hữu ích riêng từng tính năng và ý định dùng sản phẩm chung; không diễn giải ý định chung thành cam kết dùng từng tính năng.

Nhóm tự chuẩn bị và duyệt dữ liệu tour dùng cho trình diễn nếu cần. Tài liệu này không cung cấp danh mục tour, giá, lịch trình hoặc tên nhân sự giả để đưa lên web.

## Xuất và giữ bản gốc

Quản trị hoặc reviewer: đăng nhập → Phản hồi MVP → tải Phản hồi CSV và Tương tác CSV. Lưu nguyên bản theo từng đợt, cùng thời điểm xuất; không chỉnh trực tiếp tệp gốc. Bản gốc có email cần giữ trong thư mục giới hạn truy cập để đưa vào phụ lục cuối slide theo yêu cầu. Không đưa tệp gốc lên GitHub public.

Lưu trên máy, ví dụ:

```text
work/research/2026-10-17/input/taskhub-feedback.csv
work/research/2026-10-17/input/taskhub-interactions.csv
```

`work/` được bỏ khỏi Git. Tệp đã xuất, backup và bản chia sẻ cần được nhóm quản lý/xóa riêng theo thông báo lưu khoảng sáu tháng; xóa tài khoản trên web không thu hồi các bản sao ngoài hệ thống.

## Tổng hợp bằng code

Sau khi tải code nhánh build và chạy `npm ci`:

```powershell
npm run research:report -- work/research/2026-10-17/input/taskhub-feedback.csv work/research/2026-10-17/input/taskhub-interactions.csv work/research/2026-10-17/report
```

Lệnh tạo `summary.md` và `summary.json`, chỉ gồm số liệu tổng hợp. Không cần tài khoản hoặc mật khẩu trong lệnh. Dữ liệu gốc không bị sửa. Công cụ:

- Kiểm tra định dạng CSV, cột bắt buộc và giá trị; chọn phản hồi mới nhất theo email đã chuẩn hóa.
- Loại tài khoản hệ thống và email thuộc `example.test`, `example.com`, `example.invalid`; ghi số bản ghi bị loại để nhóm kiểm tra. QA dùng email khác phải được nhóm đối chiếu thủ công.
- Đối chiếu đủ bốn loại thao tác từ sau lúc đồng ý đến trước/lúc gửi phản hồi. Thống kê chính giữ mọi phản hồi hợp lệ; nhóm đủ log có bảng riêng. Thiếu log không chứng minh chưa xem demo và không tự loại tư cách tester theo PDF.
- Tổng hợp n, phân bố điểm, điểm trung bình, số chấm 4–5, vai trò/quy mô, ý định dùng và trung vị mức sẵn sàng trả có tính cả 0.
- Nếu chưa có dữ liệu, xuất trạng thái chưa có dữ liệu; không tự tạo điểm, giá tối ưu hoặc quyết định sản phẩm.

Số phản hồi đủ thao tác không xác minh 20 người độc lập, thứ tự thử, mức hiểu tính năng hoặc tính đại diện. Với mẫu nhỏ/thuận tiện, không suy rộng ra toàn thị trường. Không coi trung vị mức trả là giá bán hoặc nghiên cứu Van Westendorp.

## Sau khi có dữ liệu thật

Nhóm đối chiếu bản gốc, loại QA/trùng/người chưa thử và xác nhận người tham gia. Đọc ý kiến mở trong bản có quyền truy cập, mã hóa các vấn đề lặp lại; chọn ví dụ đã bỏ thông tin nhận diện để trình bày. So sánh ba tính năng, nêu cỡ mẫu và giới hạn.

Thành viên phụ trách giá bổ sung chi phí và căn cứ cạnh tranh trước khi chốt mức bán. Nhóm quyết định Iterate/Persevere dựa trên bằng chứng, nêu thay đổi hoặc lý do giữ sản phẩm; không để công cụ tự kết luận thay nhóm.

## Quyền xem cho giảng viên

Web có tài khoản reviewer chỉ xem và xuất CSV; thông tin đăng nhập nằm trong tệp riêng của chủ repo, không nằm trong tài liệu public. Nhóm chuyển URL và thông tin reviewer cho Thanhntl2@fpt.edu.vn qua kênh riêng, đồng thời cấp quyền xem các phụ lục dữ liệu. Chưa có bằng chứng đã chuyển thông tin hoặc cấp quyền phụ lục. Không gửi mật khẩu quản trị cho người thử.
