# TaskHub — MVP điều hành tour

Bản **0.8.0 — 09/11/2026** đã triển khai và kiểm tra tại https://taskhub-travel.pages.dev/, bổ sung báo giá theo số khách có bước duyệt, bộ mẫu công việc theo tour và bộ lọc **Việc của tôi** theo tài khoản. Xem [cách dùng và kiểm tra 0.8.0](docs/RELEASE_0_8_0.md). Mã mới trên `dev`, [PR #9](https://github.com/skunlainro3-glitch/TaskHub/pull/9) chờ chủ repo duyệt vào `main`; cả hai CI của commit tính năng đã đạt. `main` là nhánh chính, mặc định và được bảo vệ; team không push thẳng vào nhánh này.

Mục **Giá trị & doanh thu** và API kế hoạch nội bộ đã được gỡ theo yêu cầu chủ dự án. Giá/gói, giá trị mang lại, BMC và P&L được chuẩn bị trong tài liệu, slide và bảng tính riêng của nhóm. **Báo cáo vận hành** và **Quy trình vận hành** vẫn phục vụ nghiệp vụ tour.

Bản **0.7.3** đã phát hành ngày **04/11/2026**, có [hướng dẫn demo CP4 dự phòng](docs/CP4_DEMO_0_7_3.md). Giữ nguyên các tag đã phát hành. Commit/tag/deployment đã kiểm chứng được ghi tại [VALIDATION](docs/VALIDATION.md).

Các đoạn mô tả 0.7.2/0.7.0/0.6.0 bên dưới là lịch sử thay đổi; hướng dẫn thao tác hiện hành nằm trong tài liệu CP4 trên.

Cập nhật 29/10/2026: gỡ màn Hướng dẫn và các liên kết góp ý GitHub, dòng DÀNH CHO KHÁCH HÀNG, liên kết Nguồn ảnh ở chân trang; ghi công ảnh vẫn nằm trong chi tiết ảnh. Xuất dữ liệu và tự xóa tài khoản chuyển về Tài khoản & nhóm. Form mời nhân viên được căn hàng và kiểm tra responsive.

Bản **0.7.2** gỡ mục **Phản hồi MVP**, biểu mẫu đánh giá tính năng và câu hỏi mức sẵn sàng trả khỏi web theo yêu cầu chủ dự án. CP3 vẫn cần khảo sát tối thiểu 20 cá nhân và dữ liệu tương tác gốc; yêu cầu không bắt buộc biểu mẫu phải nằm trong sản phẩm. Nhóm thu phản hồi bằng Google Forms/Sheet hoặc công cụ bên ngoài do nhóm chọn. Đợt này không tạo hay công bố liên kết khảo sát mới.

Log nghiệp vụ/nút/menu có đồng ý và bản xuất dữ liệu cũ chỉ đọc dành cho admin/reviewer được giữ; không xóa phản hồi đã có. Các banner dài, thẻ “không gian dùng thử”, khối minh họa trên Tổng quan và badge “Chưa giữ chỗ tự động” được gỡ khỏi giao diện. Phân quyền, tách dữ liệu workspace, nhãn dữ liệu giả lập cần thiết và cảnh báo mạng/dữ liệu cũ vẫn giữ. Xem [bàn giao hiện hành](docs/CP4_TUAN_HUY_HANDOFF.md) và [kết quả kiểm tra](docs/VALIDATION.md).

Bản 0.7.0 bổ sung [báo cáo vận hành, xuất PDF/XLSX, ảnh 4G và bàn giao Tuấn/Huy](docs/CP4_TUAN_HUY_HANDOFF.md). Mở **Báo cáo vận hành**, **Ghép tour B2B**, hoặc chi tiết tour để dùng các chức năng mới; PDF sử dụng hộp thoại In/Lưu PDF của trình duyệt.

Bản 0.6.0 bổ sung phân vai điều hành/kinh doanh/kế toán/quản lý, sơ đồ vận hành, cảnh báo dữ liệu cũ và bảng tính giá trị/gói/doanh thu nội bộ. Xem [đối chiếu góp ý mentor và hướng dẫn demo](docs/CP4_MENTOR_REVIEW.md). Chưa có giá mở bán, SLA hoặc chấp thuận Path 2.

Web app hỗ trợ doanh nghiệp du lịch nhỏ và vừa. Local dùng React/Vite + Node.js 24 + SQLite; web công khai dùng Sites Workers + D1 từ cùng nguồn FE/BE.

**Web:** https://taskhub-travel.pages.dev/ — hoạt động độc lập với máy chủ repo.

Hai cách xem riêng: `/` và `/portal/<workspace>` là **cổng khách hàng**, xem tour công khai và gửi yêu cầu không cần tài khoản. `/app` là **không gian điều hành**, có trang đăng nhập riêng; sau đăng nhập chỉ xem/sửa dữ liệu theo quyền đã cấp. Chức danh nghề nghiệp trong khảo sát không cấp quyền quản trị. Khách chưa đăng nhập không truy cập được API nội bộ.

Danh mục gồm 13 nội dung tour nguồn Én Việt do chủ dự án cung cấp, chỉ dùng trong điều hành để tạo tour nháp. Cổng khách hàng chỉ tìm/lọc các tour do điều hành công khai, không gộp danh mục tham khảo vào kết quả. Xem [dữ liệu tour và cách đưa vào điều hành](docs/TOUR_CATALOG.md). Ngày đi, sức chứa, số khách và lịch trình từng ngày vẫn cần người quản lý xác nhận trước khi công khai một tour vận hành.

Bản 0.5 dùng bộ dữ liệu giả lập đã được chủ dự án cho phép chốt: 3 tour DEMO, 3 công việc, 2 phiếu B2B đã xác nhận và 1 phiếu chờ. Người dùng mới có không gian trống và được tự chọn **Dùng dữ liệu mẫu** để thử luồng đầy đủ; không tự tạo khảo sát hoặc người dùng giả. Xem [nguồn, cách nhập và các điểm cần đối chiếu](docs/OWNER_DEMO_DATA_2026-10-18.md); không dùng bộ này làm bằng chứng khách hàng hoặc khảo sát thật.

Giao diện chạy trên Cloudflare Pages; gateway dùng tiếp backend/database cloud hiện có. Xem [vận hành Pages](docs/PAGES_DEPLOYMENT.md); `npm run build:pages` tạo gói FE/gateway từ cùng nguồn. URL Sites cũ vẫn hoạt động và dùng cùng dữ liệu.

Lịch sử bàn giao nền tảng: [bản 0.5](docs/RELEASE_0_5.md) và [bản 0.5.1](docs/RELEASE_0_5_1.md). Đây là các mốc cũ; trạng thái hiện hành nằm trong bàn giao Tuấn/Huy và VALIDATION.

## Chạy khi mới clone

Cài Git và Node.js **24 trở lên**, rồi mở terminal:

```powershell
git clone --branch dev https://github.com/skunlainro3-glitch/TaskHub.git
cd TaskHub
npm ci
Copy-Item -LiteralPath .env.example -Destination .env
```

Mở `.env`, đặt `ADMIN_EMAIL` và `ADMIN_PASSWORD` riêng ít nhất 12 ký tự. Giữ `HOST=127.0.0.1` cho local. Không commit `.env`, mật khẩu hoặc database. Sau đó:

```powershell
npm run dev
```

Mở http://127.0.0.1:5173. Frontend dùng port 5173; API port 3001. Dừng bằng Ctrl+C.

- **Dùng thử TaskHub**: vào **Dành cho điều hành** → **Dùng thử TaskHub** để tạo tài khoản và không gian riêng trống. Người dùng tự nhập tour/công việc hoặc chủ động nạp bộ mẫu giả lập vào không gian trống; tour mới mặc định chưa công khai. Không tự tạo giá, lịch hoặc tên nhân sự.
- **Điều hành**: vào `/app` hoặc bấm **Dành cho điều hành** → **Đăng nhập** bằng tài khoản đã đặt trong `.env`. Mặc định chỉ bind localhost. Production bắt buộc mật khẩu riêng, không có mật khẩu mặc định.
- Nếu chuyển sang máy khác: cài Node.js **24 LTS**, chạy `npm ci` trước. Không dùng Node 18/20 vì backend dùng `node:sqlite`.
- Dữ liệu nằm trong `data/taskhub.sqlite` (và tệp WAL/SHM khi chạy). `data/` và `.env` đã được bỏ khỏi Git.

Để chạy lại bản demo **0.7.3 dự phòng**, chạy `git fetch --tags` rồi `git switch --detach cp4-demo-v0.7.3-final`, `npm ci` và `npm run dev`. Tag cố định code, không khóa dữ liệu live; dùng workspace demo riêng. Muốn tiếp tục sửa code thì `git switch dev`. Các tag trước giữ nguyên làm dự phòng; cách thử ba luồng mới nằm trong [bàn giao 0.8.0](docs/RELEASE_0_8_0.md).

Nếu đã clone theo hướng dẫn cũ, lưu/commit phần đang làm trước, rồi chuyển sang nhánh làm việc:

```powershell
git fetch origin --prune
git switch dev
git pull --ff-only origin dev
```

Không đổi tên nhánh `main` trên máy: đó là nhánh chính. Nhánh `build` cũ đã được đổi tên thành `main` trên GitHub.

Các lệnh `npm run build`, `npm run build:pages` và nhãn production `dev` của Cloudflare Pages giữ nguyên. Nhãn hosting không quyết định nhánh Git được phát hành; nguồn phát hành là `main` đã được duyệt.

## Phạm vi MVP

| CP2 / CP3                         | MVP chạy được                                                                                     | Cách kiểm tra                                  |
| --------------------------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| P1: thông tin rời rạc             | Tour và công việc gắn chung tour; người phụ trách, hạn và trạng thái                              | Tạo việc → chuyển Đang thực hiện → Hoàn thành  |
| P2: khách cần thông tin ngoài giờ | Cổng tour công khai: ngày, giá, lịch trình, số chỗ; gửi yêu cầu tư vấn                            | Mở cổng khách hàng, xem tour và gửi yêu cầu    |
| P3: ghép tour và đối soát B2B | Phiếu đối tác nội bộ; xác nhận giữ chỗ, ghi nhận thu/còn phải thu, hủy hoàn chỗ và CSV | Tạo phiếu → xác nhận → đối soát → hủy |
| Giảm thao tác nhập tour | Nhập XLSX/CSV có xem trước; chọn nội dung có nguồn và đổi số chỗ/giao việc ngay trên thẻ | Nhập tệp thành bản nháp, kiểm tra portal sau khi công khai |
| Lịch / số chỗ dùng chung          | Điều hành và portal dùng chung dữ liệu theo workspace: SQLite local, D1 public; polling khi tab đang hiển thị | Sửa số khách hoặc ngày, kiểm tra portal |
| Tránh cập nhật sai                | Kiểm tra số khách không vượt sức chứa; phiên bản tour để từ chối ghi đè bản cũ                    | Thử vượt sức chứa hoặc sửa đồng thời ở hai tab |
| CP3: người dùng thử thật          | Đăng ký tự nguyện và log thao tác; nhóm thu phản hồi bằng khảo sát bên ngoài, không còn form đánh giá/giá trên web | Tester dùng MVP rồi trả lời công cụ khảo sát do nhóm cung cấp |
| CP3: dữ liệu gốc                  | Admin/reviewer xuất nhật ký tương tác; các bản xuất phản hồi lịch sử chỉ đọc vẫn được bảo vệ quyền | Tài khoản & nhóm → Nhật ký thao tác CSV; bản xuất lịch sử theo quyền |

Đã bổ sung **B2B tối giản** (phiếu ghép, xác nhận chỗ, ghi nhận thu/còn phải thu và CSV), nhập **XLSX/CSV** tối đa 20 tour/đợt, chọn nội dung tour trong hai lần chạm và đổi số chỗ/giao việc ngay trên thẻ. Xem [bảng P1–P3/S-1–S-4](docs/CP2_FEATURE_MAP.md) và [bản demo cố định](docs/CP3_DEMO_RELEASE.md).

Đợt hoàn thiện file tiến độ bổ sung [bộ tập demo](docs/CP3_REHEARSAL.md), [quy trình hoàn tất 8 việc](docs/CP3_CLOSEOUT.md) và `npm run survey:report` để tổng hợp riêng 6 nhóm tính năng từ hai CSV raw của An. Giảng viên chưa được gửi/cấp quyền mới theo yêu cầu chủ dự án.

Bản 0.4 thêm sửa/xóa công việc có phiên bản, lọc việc quá hạn, lịch sử đối soát B2B theo người/thời gian/số trước-sau, nạp lại khi xung đột và hướng dẫn mở trực tiếp từng luồng. Tour đã qua ngày khởi hành theo giờ Việt Nam không nhận tư vấn mới; tour vừa rút công khai sẽ khóa form đang mở. Xem [báo cáo rà soát và thông tin nhóm cần bổ sung](docs/WEB_REVIEW_2026-10-18.md).

Bản 0.4.1 thêm tìm tour không dấu, lọc ngày/chỗ, số kết quả và đặt lại bộ lọc. Từ 0.7.3 danh mục tham khảo chỉ còn trong điều hành. Form nhập/lưu khóa các lối đóng trong lúc xử lý. API tư vấn kiểm tra lại khả dụng ngay lúc ghi dữ liệu, không tự giữ chỗ. Nhóm mới nhận code đọc [hướng dẫn mã nguồn](docs/CODE_GUIDE.md).

B2B chưa có đối tác tự đăng nhập/duyệt; net price chỉ theo từng phiếu, chưa quản lý net/markup toàn tour hoặc nhà cung cấp. Thanh toán, chatbot và Google login chưa triển khai. Xác minh email đã được bỏ theo yêu cầu chủ dự án. Khôi phục mật khẩu có luồng/token nhưng chưa có dịch vụ gửi email. Nhân viên có tài khoản riêng theo lời mời và quyền được cấp. Từ 0.8.0, công việc có thể gắn tài khoản phụ trách để lọc **Việc của tôi**; tên nhập tay cũ vẫn được giữ, không tự ghép theo tên và chưa có thông báo tự động.

Yêu cầu tư vấn không giữ chỗ hoặc xác nhận booking; chưa có tiền giao dịch thật. Tour, giá, lịch và người phụ trách phải do người quản lý nhập; bản cài mới không tự tạo dữ liệu kinh doanh. Giá SaaS chưa chốt; 500.000 VND/tháng trong CP2 là giả định, không dùng làm kết quả khảo sát. Từ 0.7.2, web không thu mức sẵn sàng trả hoặc có form Van Westendorp; phân tích giá dùng dữ liệu khảo sát bên ngoài đã được nhóm cung cấp và xác minh.

## Demo và xuất báo giá

Dùng [bàn giao 0.8.0](docs/RELEASE_0_8_0.md) để thử báo giá và công việc mới; [kịch bản 6 phút P1–P3](docs/CP4_DEMO_0_7_3.md) giữ làm mốc dự phòng. Vào **Báo giá** để lập số khách, đơn giá, giảm giá cả đoàn và hạn hiệu lực; lưu nháp → gửi duyệt → xuất Excel hoặc In/Lưu PDF sau khi được duyệt. Sửa bản đã duyệt phải mở lại nháp và duyệt lại.

Chức năng xuất trong **chi tiết tour** vẫn tách riêng: bấm tên/ảnh tour để xem **Báo giá Excel** hoặc **In / lưu báo giá PDF**; đây là thông tin tour và giá một khách, không phải báo giá theo đoàn đã qua duyệt. Portal cũng xem được thông tin công khai này. **Sửa tour** là thao tác riêng dành cho người có quyền.

Excel/CSV công nợ B2B xuất **toàn không gian**; bản in PDF theo **bộ lọc đang xem**. Đọc nhãn phạm vi cạnh nút trước khi đối chiếu. PDF mở hộp thoại trình duyệt để chọn Lưu dưới dạng PDF, không tự tải PDF từ máy chủ.

## Thử với ít nhất 20 người

CP3 Requirements mục 2.1 yêu cầu ít nhất **20 cá nhân**, xem/dùng MVP rồi đánh giá tính năng. Mời >20 người theo lịch nhóm để dự phòng. Gửi **link gốc của web** (nút Dùng thử TaskHub), không gửi link `/portal/<id>` riêng của người khác.

- Mỗi người tự tạo tài khoản bằng email và đồng ý thông báo dữ liệu. Email do người dùng nhập, **chưa xác minh**; không suy luận số email = số người độc lập.
- Yêu cầu sửa tour, xem portal, tạo/đổi trạng thái việc rồi trả lời khảo sát bên ngoài. Phân biệt tự dùng/xem demo/chưa thử, ghi thời gian và thông tin đối chiếu cần thiết trong bảng khảo sát do nhóm quản lý. Tải lại tự động không ghi nhận thêm lượt xem.
- Nhật ký tương tác gồm email, vai trò, quy mô, consent timestamp/version, action, entity và thời gian UTC. Biểu mẫu phản hồi đã gỡ không nhận bản ghi mới; CSV phản hồi lịch sử vẫn đọc/xuất theo quyền, không tự chuyển thành kết quả của khảo sát mới.
- Nhóm đối chiếu người thử thật và thời điểm khảo sát với log; không suy luận số email bằng số cá nhân hoặc số lần bấm bằng số người. Không tính dữ liệu tự động/QA vào khảo sát. Việc gỡ form không tự hoàn tất yêu cầu 20 cá nhân, phân tích hay Iterate/Persevere.
- Không tự quyết định Iterate/Persevere hoặc giá khi chưa có dữ liệu thật. Phần slide, BMC và phân tích giá thuộc phân công riêng; repo chỉ cung cấp dữ liệu phục vụ các phần đó.

Hướng dẫn và bộ câu hỏi trước đây nằm ở [khảo sát và dữ liệu CP3](docs/CP3_TESTING_GUIDE.md), [câu hỏi bàn giao An](docs/CP3_SURVEY_QUESTIONS.md). Những đoạn hướng dẫn gửi form trong web là lịch sử trước 0.7.2. Đợt này không tạo Google Forms/Sheet hoặc tự xác nhận link cũ còn dùng được. Với hai CSV raw của An đúng schema, hoặc bản xuất sáu tính năng lịch sử được cấp quyền, công cụ offline vẫn chạy:

```powershell
npm run survey:report -- work/survey/taskhub-survey-testers.csv work/survey/taskhub-survey-features.csv work/survey/report
```

Tệp tương tác được giữ để đối chiếu hành vi. Bộ tổng hợp **legacy** bên dưới chỉ đọc phản hồi ba tính năng đã có từ trước, không nhận phản hồi mới và không dùng thay cho CSV sáu tính năng:

```powershell
npm run research:report -- work/research/input/taskhub-feedback.csv work/research/input/taskhub-interactions.csv work/research/report
```

Tool tạo `summary.md` và `summary.json` chỉ có thống kê tổng hợp, kiểm tra dữ liệu và đối chiếu thao tác trước phản hồi; không sửa bản gốc, xuất email, tự chọn giá hoặc kết luận sản phẩm. `work/` không được commit. Báo cáo rỗng ghi rõ chưa có dữ liệu; 20 email không được coi là 20 cá nhân đã xác minh.

Tài liệu trình diễn và giải thích kỹ thuật: [bàn giao FE/BE](docs/CP3_FE_BE_HANDOFF.md). Trạng thái còn thiếu được cập nhật ở [đối chiếu CP3](docs/CP3_READINESS.md).

## Tài khoản và đội ngũ

Mục **Tài khoản & nhóm** cho phép chủ không gian tạo lời mời riêng theo email, chọn bộ phận và quyền **chỉ xem / được sửa**, đổi quyền và thu hồi truy cập. Menu/API/export giới hạn theo bộ phận; không phải nhân viên nào cũng đọc toàn bộ tư vấn/B2B. Nhân viên không tính vào khảo sát; log UI phục vụ tài khoản tester đã đồng ý, không phải audit đầy đủ mọi nhân viên. Tên người phụ trách việc vẫn là thông tin tự nhập. Xem [tài khoản và cấu hình email](docs/ACCOUNTS_AND_TEAM.md).

Thẻ **Tài khoản & bảo mật** chỉ hiển thị tên, email và quyền hiện tại. Xác minh email đã được xóa khỏi giao diện, API và hàm xử lý; đường dẫn API cũ không còn tồn tại. Khôi phục mật khẩu giữ token dùng một lần/có hạn; production chưa kết nối dịch vụ gửi email nên không trả token khôi phục hoặc giả vờ đã gửi. Lời mời nhân viên sao chép thủ công vẫn hoạt động. Không dùng tài khoản Gmail cá nhân làm dịch vụ gửi thư ngầm.

CP3 mục 2.1–2.3 và phân công Tuấn yêu cầu người thử, phản hồi và log thao tác gốc; không yêu cầu chức năng đo bài thử. Phần đo thời gian, lịch sử, thống kê và CSV riêng đã được xóa khỏi mã nguồn theo yêu cầu chủ dự án. Log nút/menu có email, thời điểm và CSV khảo sát vẫn được giữ. Không dùng số tài khoản, dữ liệu mẫu hoặc QA thay bằng chứng 20 người thật.

## Bảo vệ / lưu dữ liệu

Cookie phiên đăng nhập HttpOnly/SameSite; production dùng Secure. Mật khẩu người thử được salt/hash bằng scrypt. SQL dùng prepared statements. API điều hành giới hạn theo workspace; export chỉ cho quản trị và reviewer được cấp quyền. Public portal chỉ đọc tour đã công khai và không trả email/khách hàng/công việc. Có kiểm tra origin và header riêng cho thao tác thay đổi, giới hạn tần suất đăng ký/đăng nhập/gửi yêu cầu.

Thông báo đồng ý xuất hiện trước khi đăng ký; consent v1 được ghi cùng thời gian. Người thử xóa tài khoản và dữ liệu tại Tài khoản & nhóm. Dữ liệu khảo sát/yêu cầu tư vấn quá **180 ngày** được xóa khi server khởi động và mỗi 12 giờ server chạy. `npm run data:purge` có thể chạy thủ công. Nhóm cần xóa riêng CSV, bản backup và bản đã chia sẻ; chức năng này không thể xóa bản ngoài hệ thống. Không tuyên bố quy trình đã được kiểm toán tuân thủ pháp luật.

## Kiểm tra và build

```powershell
npm test
npm run build
npm start
```

`npm start` phục vụ cả FE build và API tại http://127.0.0.1:3001. Không cần Vite trên production. Test tích hợp dùng SQLite tạm, kiểm tra consent, phân tách tenant, sync, sức chứa, ghi đồng thời, task, inquiry, CSV, lưu sau restart và xóa dữ liệu. Test không nhập email hoặc dữ liệu CP2 thật.

Kiểm thử UI: để `npm run dev` đang chạy trong terminal thứ nhất, chạy `npm run test:ui` trong terminal thứ hai. Windows dùng Edge chạy ẩn; hệ điều hành khác cần `npx playwright install chromium`. Có thể đặt `PLAYWRIGHT_CHANNEL` hoặc `TEST_URL` nếu dùng môi trường khác. Script tạo tài khoản/email giả, thử tour → portal → inquiry → task/B2B và đối chiếu log; kiểm tra màn hình 320/390/768/1440px, phục hồi kết nối và tìm kiếm, rồi xóa tài khoản test. Menu/form Phản hồi MVP không còn là bước demo. Ảnh QA lưu trong `work/`. Các script dùng tài khoản QA tạm riêng và xóa trong finally; không chỉnh sửa dữ liệu nghiệp vụ sẵn có. Kiểm tra mới: `TEST_URL=http://127.0.0.1:3001 node tests/v05-ui.mjs` (PowerShell đặt `$env:TEST_URL` trước).

Giao diện dùng nền xanh dương nhạt, nút xanh đậm và chữ slate. Khi mạng lỗi, web phân biệt dữ liệu chưa tải được với tìm kiếm không có kết quả, và cho phép tải lại. Menu mobile có lớp nền, nút đóng, Escape và trạng thái truy cập bằng bàn phím. Không còn hero trang trí, form Phản hồi MVP hoặc màn Hướng dẫn đã bỏ.

Xem [bảng đối chiếu CP3](docs/CP3_READINESS.md) cho phần đã xây, giới hạn và bằng chứng còn cần thu.

## Deploy

**Web cloud đã hoạt động:** https://taskhub-travel.pages.dev/ — FE chạy trên Pages, API đi qua gateway có chữ ký tới Sites Workers và dữ liệu lưu ở D1; máy chủ repo tắt vẫn truy cập được. Xem [vận hành Pages](docs/PAGES_DEPLOYMENT.md) và [backend cloud](docs/CLOUD_HOSTING.md); không dùng link Quick Tunnel cũ để thu khảo sát.

Phương án hosting thay thế đã chuẩn bị: **Render Free + Turso Free**, xem [hướng dẫn deploy](docs/DEPLOYMENT.md). Chưa triển khai phương án này; không cần tạo Render/Turso để dùng URL cloud hiện tại.

Cũng có Dockerfile/Compose cho VPS hoặc hosting có persistent disk, dùng một instance Node + SQLite volume. Các bước dưới đây chỉ áp dụng khi tự host với ổ đĩa bền vững:

1. Copy `.env.example` thành `.env`, đặt `ADMIN_EMAIL` và mật khẩu mạnh riêng trong `ADMIN_PASSWORD`. Không commit `.env`.
2. Máy có Docker: `docker compose up -d --build`. App ở `127.0.0.1:3001`; dữ liệu trong named volume `taskhub_data`.
3. Đặt reverse proxy HTTPS phía trước app, giữ nguyên Host/origin. Khi `NODE_ENV=production`, cookie Secure cần trình duyệt truy cập qua HTTPS để đăng nhập. Compose không tự cấu hình domain/chứng chỉ.
4. Với platform deploy trực tiếp Node: Build `npm ci && npm run build`, Start `npm start`; đặt `NODE_ENV=production`, `HOST=0.0.0.0`, `PORT` do platform cấp, `DATA_DIR` tới persistent disk và admin credentials. Chỉ chạy **một instance** với SQLite này.
5. Kiểm tra `/api/health`, đăng ký thử, sửa tour, refresh portal và restart service để xác minh disk giữ dữ liệu. Xóa tài khoản QA trước khi mời tester.

Dockerfile là phương án tự host đã chuẩn bị; Docker daemon chưa chạy nên chưa xác nhận build container. Web cloud hiện tại dùng Workers/D1 và đã được triển khai thực tế.

Sao lưu SQLite đang chạy bằng `node --env-file-if-exists=.env scripts/backup.mjs` (dùng SQLite backup API, không copy mỗi tệp `.sqlite` khi WAL đang hoạt động). Bản backup chứa dữ liệu cá nhân; nhóm giữ riêng và quản lý thời hạn. Để restore: dừng app, xác minh thư mục dữ liệu, sao lưu hiện trạng, thay DB bằng bản backup bằng thao tác file có chủ đích; không xóa volume để restart/deploy.
