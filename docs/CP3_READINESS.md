# Đối chiếu TaskHub với CP3 — rà soát 28/10/2026

Cập nhật **0.7.2** theo yêu cầu chủ dự án: gỡ menu/form **Phản hồi MVP** và câu hỏi mức sẵn sàng trả khỏi web. CP3 mục 2.1–2.3 yêu cầu khảo sát tối thiểu 20 cá nhân, đánh giá tính năng và raw interactions, không nêu bắt buộc form nằm trong website. Nhóm thu phản hồi bên ngoài bằng công cụ do nhóm chọn; đợt này không tạo hoặc công bố Google Forms/Sheet mới. Log có đồng ý và bản xuất phản hồi lịch sử chỉ đọc dành cho admin/reviewer được giữ; dữ liệu đã thu không bị xóa. Việc gỡ form không đồng nghĩa toàn bộ CP3 đã hoàn tất.

Tài liệu giữ lại các phép kiểm tra CP3 theo ngày, đồng thời cập nhật những chức năng đã thay đổi. **Trạng thái bàn giao hiện hành của Tuấn/Huy nằm ở [bàn giao CP4](CP4_TUAN_HUY_HANDOFF.md); kết quả phát hành nằm ở [xác nhận kiểm tra](VALIDATION.md).** Số đếm khảo sát ngày 17/10 bên dưới là ảnh chụp tại thời điểm đó, không phải số hiện tại. File khảo sát CP3 gửi sau có 22 dòng tự khai báo; chưa đủ căn cứ để tự xác nhận 20 cá nhân thử thật hoặc cộng với CP2 thành người độc lập.

Cập nhật 27/10: có phân vai theo bộ phận và API, sơ đồ vận hành, cảnh báo dữ liệu cũ, bảng tính giá trị/gói/doanh thu nội bộ. Xem [bổ sung theo mentor](CP4_MENTOR_REVIEW.md). Các mục chưa hoàn thành về khảo sát, giá và Path 2 vẫn cần bằng chứng/phê duyệt riêng; không suy ra từ chức năng mới.

**FE/BE của Tuấn đã có bản public và tài liệu bàn giao. Toàn bộ CP3 chưa hoàn thành.** Kiểm tra ngày 17/10: 0 tài khoản người thử, 0 phản hồi, 0 interaction event; chưa có bằng chứng 20 cá nhân đã thử thật.

Cập nhật 24/10: 3 tour, 3 việc, 2 B2B xác nhận và 1 chờ theo quy ước giả lập được chủ dự án cho phép quyết định. Có nhân viên cùng không gian và bộ mẫu tùy chọn. Chức năng đo bài thử và xác minh email đã được xóa; log thao tác/CSV khảo sát vẫn giữ theo yêu cầu CP3. Bảng tester chưa đủ căn cứ xác nhận 20 người thật.

Web: https://taskhub-travel.pages.dev/. Code mới tiếp tục đẩy lên `build`; giữ `dev` để chủ repo duyệt sau.

Đợt 18/10 đã bổ sung B2B tối giản, nhập XLSX/CSV, thao tác nhanh và log nút/menu. Xem [bảng P1–P3/S-1–S-4](CP2_FEATURE_MAP.md), [tag và kịch bản demo](CP3_DEMO_RELEASE.md) và [bộ câu hỏi/Sheet bàn giao An](CP3_SURVEY_QUESTIONS.md). Các bản ghi khảo sát không được điền sẵn.

## Căn cứ và phạm vi

- CP3 Requirements EXE101FA26.pdf, trong phạm vi đợt FE/BE này: Uses, Specs, Interface, Packaging, Price/strategy, Special Features, Support; tối thiểu 20 cá nhân thử; RAW interactions có email ở phụ lục; Iterate/Persevere sau feedback; demo trực tiếp và quyền xem MVP; BMC đúng một trang. Van Westendorp là phần nâng cao tùy chọn. Việc chuyển thông tin/quyền xem giảng viên đang tạm giữ theo yêu cầu chủ dự án.
- CP3 MVP Presentation & BMC Write-up Rubric: chất lượng và ý nghĩa validation, giải quyết pain CP2, demo chức năng/UI/UX, lập luận quyết định và BMC.
- TaskHub_CP2_Paper_Report.pdf: khách hàng mục tiêu doanh nghiệp lữ hành 10–50 nhân sự, người dùng điều hành/Sales. Trang 16 giới hạn bản đầu ở portal 24/7, đồng bộ lịch/số chỗ và giao việc nội bộ. Nhà cung cấp/net price/markup đầy đủ, mạng lưới đối tác và paid pilot là phạm vi rộng hơn, chưa được đánh dấu hoàn thành.
- Business Model Canvas (4).docx là mẫu trống. BMC bổ sung sau đó được dùng để đối chiếu định hướng, không tự chuyển kế hoạch giá, tích hợp hoặc hỗ trợ thành tính năng/cam kết hiện có.
- Đọc lại CP3_context ngày 17/10: vẫn là các mục tên thành viên/nội dung giữ chỗ, chưa có đặc tả mới trong “Thống Nhất”. Không coi nội dung giữ chỗ là phê duyệt yêu cầu.

Chủ dự án xác nhận đợt này chỉ làm FE/BE và bàn giao. Không làm thay slide, BMC, quyết định giá hoặc kết luận khảo sát. Không tự đưa tour, giá, lịch trình, tên nhân sự, kênh hỗ trợ hoặc lời chứng thực chưa được cung cấp lên web.

## Phần đã chuẩn bị trong phạm vi FE/BE

| Yêu cầu | Đã có | Giới hạn/bằng chứng còn thiếu |
| --- | --- | --- |
| Uses | Tour/lịch/giá/chỗ, công việc, tư vấn; nhập XLSX/CSV; B2B tối giản với phiếu, xác nhận chỗ, ghi nhận thu/còn phải thu, lịch sử, CSV/Excel và bản in; báo cáo vận hành | Có nhân viên theo bộ phận và quyền xem/sửa; chưa có đối tác tự duyệt; không gọi đây là B2B đầy đủ hoặc P3 được giải quyết hoàn toàn. |
| Specs | SQLite local; public Pages/gateway và Workers/D1; kiểm tra phiên bản, sức chứa, phân quyền và timeout | Polling 5 giây khi tab hiển thị, không phải WebSocket. QA không phải chứng nhận SLA hoặc tải thương mại. |
| Interface/Packaging | Web tiếng Việt, xanh dương nhạt, responsive; đã rà 320/390/768/1440 px và luồng lỗi mạng | Cần phản hồi và thử trên thiết bị/mạng của người dùng thực tế. |
| Special Features (mục rubric) | Có thể demo dữ liệu tour/việc dùng chung; gọi đây là **core feature**, theo góp ý mentor | Chưa chứng minh tính độc nhất, innovation hoặc lợi thế thị trường; cần đối chiếu đối thủ/bằng chứng, không suy ra đủ Path 2. |
| Support | README và tài liệu bàn giao; màn Hướng dẫn, liên kết góp ý GitHub và menu/form Phản hồi MVP đã gỡ | Chưa được cung cấp kênh công khai/người trực hoặc mức dịch vụ. Không tự thêm SLA hoặc link khảo sát. |
| Giá | Công cụ offline đọc dữ liệu đã có; bản nháp Giá trị & doanh thu giữ riêng. Web không còn form willingness-to-pay | Nhóm thu/phân tích giá bên ngoài; chưa chốt chiến lược/giá. 500.000 VND/tháng ở CP2 là giả định, không phải giá đã kiểm chứng. |
| MVP testing | Consent, email tự nhập, vai trò/quy mô và log thao tác; phản hồi thực hiện bằng khảo sát bên ngoài. Menu/form sáu nhóm tính năng và API gửi đánh giá trên web đã gỡ | Nhóm phải cung cấp công cụ khảo sát, ghi thời điểm/định danh đối chiếu và xác minh người thử thật. Không tự suy ra 20 cá nhân từ số email. Phản hồi phiên bản cũ giữ nguyên, không tự chuyển thang đo hoặc tạo kết quả mới. |
| RAW data | Nhật ký tương tác CSV và các bản xuất phản hồi lịch sử chỉ đọc có email theo quyền admin/reviewer | Nhóm phải xuất bản gốc, đối chiếu phản hồi ngoài web với log và cấp quyền phụ lục; không đưa raw data lên repo public. |
| Nút/menu | `ui_click`/`ui_change` cho tài khoản người thử đã đồng ý; mã điều khiển, khu vực, thời gian thiết bị/server; chống ghi trùng lô gửi lại | Không ghi nội dung gõ/mật khẩu. Mất mạng/đóng trình duyệt đột ngột có thể thiếu log; admin/reviewer không tính. |
| Bộ câu hỏi cho An | 12 câu, 6 nhóm tính năng; đánh giá quan trọng, ý định dùng và dễ dùng theo từng tính năng; Sheet raw để trống tại lúc bàn giao | Bộ câu hỏi không phải kết quả khảo sát hoặc bằng chứng đã có 20 người. Không suy ra trạng thái Sheet hiện tại từ lần đọc cũ. |
| Tổng hợp dữ liệu | `survey:report` cho CSV Người thử/Đánh giá tính năng bản 0.4 hoặc hai tab raw của An; `research:report` cho Phản hồi bản trước/Tương tác CSV | Không cộng số email giữa hai nguồn. Không tự loại người xem demo vì thiếu log, xác minh người thật, chọn giá hoặc kết luận Iterate/Persevere. |
| Demo và reviewer | Kịch bản demo trực tiếp, tài khoản reviewer chỉ xem/xuất; bộ giả lập có 3 tour, 3 công việc, 2 phiếu B2B xác nhận và 1 phiếu chờ theo quy ước đã được chủ dự án cho phép | Các quy ước khách/thu B2B và TASK-03 chỉ dành cho demo, không xác minh giao dịch thật. Chưa chuyển thông tin hoặc cấp quyền mới cho giảng viên theo yêu cầu chủ dự án. |

Hướng dẫn chi tiết: [bàn giao FE/BE](CP3_FE_BE_HANDOFF.md), [đọc và sửa mã nguồn](CODE_GUIDE.md), [khảo sát và tổng hợp CSV](CP3_TESTING_GUIDE.md), [chạy trên máy](../README.md), [vận hành public](PAGES_DEPLOYMENT.md).

## Lịch sử kiểm chứng ngày 17–18/10

- 40 kiểm tra Node/API, gateway và công cụ tổng hợp đạt trên SQLite và libSQL ở đợt 18/10, gồm B2B giữ/hoàn chỗ, đối soát, nhập tệp và quyền/giới hạn log. UI kiểm tra thêm XLSX thật, thao tác nhanh và luồng B2B. Không dùng QA làm khảo sát.
- Bản 0.4 nâng lên 58 kiểm tra, thêm sửa/xóa việc có phiên bản, khảo sát 6 tính năng/CSV, khóa tư vấn tour đã khởi hành và audit B2B. Hướng dẫn mới có lối mở từng chức năng và bảng P1–P3/S-1–S-4 ngay trong app.
- Đã tải CSV thật từ hệ thống bằng quyền quản trị và chạy tool: 0 dòng phản hồi, 0 dòng tương tác, không có kết quả để kết luận. Raw và báo cáo được giữ riêng dưới `work/research/2026-10-17/`, không commit.
- Ngày 17/10, 20 lần đọc đồng thời cổng công khai lúc đó trống đều trả 200. Mẫu đo từ máy/mạng này: trung vị 643,5 ms; p95 1.093 ms. Đây là một mẫu request, không phải 20 người, phép đo tải đại diện hoặc cam kết hiệu năng.
- Ngày 18/10, API D1 và UI production qua Pages đạt thêm luồng B2B/Excel, thao tác nhanh, log click đã lưu, quyền reviewer và màn hình desktop/mobile; không có lỗi JavaScript trong các luồng đã thử.
- Công cụ tổng hợp xử lý dữ liệu rỗng, nháy/xuống dòng trong CSV, dữ liệu cắt/sai cột, email trùng, QA, thao tác sau phản hồi và mức trả bằng 0. Không xuất email/tên/ý kiến tự do vào báo cáo tổng hợp.

## Việc còn lại cần người thật hoặc quyết định của nhóm

1. Cung cấp ảnh nguồn thay thế, liên hệ hỗ trợ công khai được duyệt và phân quyền nhân viên thực tế. Quy ước demo về khách B2B, tiền B2B-102 và tour của TASK-03 đã được chủ dự án cho phép quyết định, ghi tại [dữ liệu giả lập của nhóm](OWNER_DEMO_DATA_2026-10-18.md); không còn là thông tin chặn demo. Không nhập lại hoặc sửa lịch sử thành giao dịch thật. Cung cấp GitHub username nếu cần quyền push.
2. Tuyển và xác nhận ít nhất 20 cá nhân thử thật, ưu tiên phân khúc mục tiêu; ghi kênh tuyển, thời gian, tiêu chí và giới hạn mẫu thuận tiện. Mời trên 20 người theo timeline để dự phòng.
3. Đối chiếu logs với phản hồi, đọc/mã hóa ý kiến mở, phân tích kết quả; chốt chiến lược và mức giá có căn cứ.
4. Quyết định Iterate/Persevere sau dữ liệu thật, giải thích thay đổi hoặc lý do giữ sản phẩm.
5. Hoàn thiện slide và BMC đúng một trang trong phần việc của nhóm.
6. Chỉ chuyển quyền xem MVP/credential reviewer và phụ lục dữ liệu khi chủ dự án yêu cầu lại. Hiện chưa gửi; có sẵn tài khoản không chứng minh giảng viên đã nhận quyền/thông tin.
7. Nhóm trưởng book/xác nhận slot và lịch nộp chính thức. Các bản timeline do nhóm cung cấp đã thay đổi; lịch 17/10 book, 18–19/10 phân tích là kế hoạch cũ, không phải xác nhận thực hiện. Mốc 21/10 nộp và 23/10 thuyết trình cũng cần đối chiếu lịch nhóm mới nhất. PDF quy định nộp trước slot tuần 7.

Không gửi email, nộp bài, book lịch hoặc thay đổi nội dung của thành viên khác trong đợt hoàn thiện FE/BE này.

## Lịch sử kiểm tra và giới hạn 0.5

86 kiểm tra đạt trên SQLite và libSQL. Hai bộ trình duyệt kiểm tra các luồng cũ và bổ sung nạp mẫu/bài thử/mời nhân viên/quyền xem-sửa/xóa staff/khôi phục khi chưa có email provider. Migration 0003 bổ sung bảng, giữ nguyên migration cũ. Không có tester thật, paid pilot, quyết định giá, slide/BMC hoặc quyền giảng viên tự phát sinh từ lần nâng cấp này.
