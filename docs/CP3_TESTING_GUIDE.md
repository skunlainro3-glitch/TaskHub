# Thực hiện khảo sát MVP và chuẩn bị dữ liệu CP3

Ngày rà soát: 04/11/2026. Tài liệu vận hành cho nhóm; không phải kết quả khảo sát. Từ 0.7.2, web không còn form Phản hồi MVP hoặc câu hỏi mức phí; dùng công cụ khảo sát bên ngoài được nhóm chọn.

## Tuyển và hướng dẫn người thử

1. Nhóm ghi lại kênh tuyển, thời gian, tiêu chí và số người mời. Ưu tiên điều hành, Sales và quản lý doanh nghiệp lữ hành; ghi rõ người ngoài phân khúc. Mời trên 20 người để có dự phòng; PDF yêu cầu tối thiểu 20 cá nhân.
2. Gửi link https://taskhub-travel.pages.dev/. Mỗi người tự đăng ký bằng email, tự chọn vai trò/quy mô và đọc lời đồng ý. Email hiện chưa được xác minh; nhóm đối chiếu người tham gia thực tế.
3. Người thử tự nhập thông tin tour, chọn công khai, lưu; mở lại tour đổi lịch hoặc số khách đã giữ chỗ. Không cần thông tin khách hàng thật. Không gian của mỗi người tách biệt.
4. Mở Cổng khách hàng để xem thông tin vừa thay đổi. Trở lại Công việc, tạo việc gắn với tour và đổi trạng thái.
5. Cho xem/thử thêm B2B, nhập Excel và thao tác nhanh nếu phù hợp. Sau trải nghiệm, trả lời khảo sát ngoài web do nhóm cung cấp; phân biệt Tự dùng/Xem demo/Chưa thử theo từng tính năng. Chỉ người tự thao tác chấm độ dễ dùng; không gán Chưa thử thành 0. Không tự dùng lại một link cũ khi chưa xác nhận người quản lý và tình trạng khảo sát.
6. Không hướng người thử chấm tích cực. Hỏi lý do, khó khăn và điểm không thích; sau khi trải nghiệm bổ sung, người thử có thể cập nhật. Giữ các loại câu hỏi cũ/mới riêng khi phân tích, không biến điểm hữu ích cũ thành điểm quan trọng mới.

Bộ câu hỏi bổ sung cho An: [12 câu đánh giá sau thử](CP3_SURVEY_QUESTIONS.md). Bảng khảo sát cần tách tự dùng với xem demo theo từng tính năng. Đối chiếu khảo sát ngoài web với log bằng email/mốc trải nghiệm khi được đồng ý; không nhập phản hồi vào database để tạo bằng chứng giả. Các bản xuất khảo sát cũ giữ riêng, không coi là phản hồi mới.

Nhóm tự chuẩn bị và duyệt dữ liệu tour dùng cho trình diễn nếu cần. Tài liệu này không cung cấp danh mục tour, giá, lịch trình hoặc tên nhân sự giả để đưa lên web.

## Xuất và giữ bản gốc

Quản trị hoặc reviewer: đăng nhập → **Tài khoản & nhóm → Dữ liệu kiểm thử → Nhật ký thao tác CSV**. Mục mở rộng **Bản xuất khảo sát đã lưu** chỉ đọc chứa các bản Người thử/Đánh giá tính năng/Phản hồi cũ; không có API gửi phản hồi mới. CSV hai tab Raw_testers/Raw_features do nhóm thu bên ngoài hoặc bản xuất sáu tính năng lịch sử đúng schema dùng với `survey:report`; phản hồi ba tính năng trước đó dùng với `research:report`. Lưu nguyên bản theo đợt/thời điểm, không sửa trực tiếp. Raw có email phải giữ ở thư mục giới hạn quyền, không đưa lên GitHub public hoặc màn chiếu.

Log UI chỉ dành cho tài khoản tester đã đồng ý; admin/reviewer/staff bị loại khỏi thống kê nghiên cứu. Đây không phải audit mọi nhân viên; khách ẩn danh không tự có email định danh. Mất mạng hoặc đóng đột ngột có thể thiếu log. Không lấy số click/tài khoản làm số người thật.

Lưu trên máy, ví dụ:

```text
work/research/2026-10-17/input/taskhub-feedback.csv
work/research/2026-10-17/input/taskhub-interactions.csv
```

`work/` được bỏ khỏi Git. Tệp đã xuất, backup và bản chia sẻ cần được nhóm quản lý/xóa riêng theo thông báo lưu khoảng sáu tháng; xóa tài khoản trên web không thu hồi các bản sao ngoài hệ thống.

## Tổng hợp bằng code

Sau khi tải code nhánh `dev` và chạy `npm ci`:

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

Nhóm đối chiếu bản gốc, loại QA/trùng và xác nhận người tham gia. Đọc ý kiến mở trong bản có quyền truy cập, mã hóa các vấn đề lặp lại; chọn ví dụ đã bỏ thông tin nhận diện để trình bày. So sánh từng tính năng với cỡ mẫu tự dùng/xem demo riêng; chưa thử không được tính thành điểm 0.

Thành viên phụ trách giá bổ sung chi phí và căn cứ cạnh tranh trước khi chốt mức bán. Nhóm quyết định Iterate/Persevere dựa trên bằng chứng, nêu thay đổi hoặc lý do giữ sản phẩm; không để công cụ tự kết luận thay nhóm.

## Quyền xem cho giảng viên

Web có tài khoản reviewer chỉ xem/xuất; thông tin đăng nhập giữ riêng, không ở tài liệu public. Theo yêu cầu chủ dự án, **chưa gửi hoặc cấp quyền mới cho giảng viên**. Chỉ khi chủ dự án xác nhận lại thời điểm và đúng người nhận, nhóm mới chuyển URL/thông tin reviewer qua kênh riêng và cấp quyền xem phụ lục. Không gửi mật khẩu quản trị cho người thử.
