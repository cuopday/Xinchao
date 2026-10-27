#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Sinh js/curriculum.json — bộ khung BÀI HỌC / CHỦ ĐỀ tái sử dụng cho thư viện 1370 mô hình.

Nguyên tắc:
  - Mỗi bài học (lesson) tham chiếu model bằng ID -> không nhân bản dữ liệu, models.json giữ nguyên.
  - Chủ đề (theme) là nhóm các bài học cùng mạch kiến thức.
  - Khối lớp: 1..12 (Tiểu học 1-5, THCS 6-9, THPT 10-12).
  - Có "kinds" để khớp tự động với models.json (mở rộng: thêm bài mới chỉ cần thêm JSON, không sửa code).

Chạy:  python3 js/curriculum-gen.py
"""
import json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))

def L(code, title, block, kinds, grade, objectives, activities, homework, note=""):
    return {
        "code": code, "title": title, "block": block, "grade": grade,
        "modelKinds": kinds, "objectives": objectives,
        "activities": activities, "homework": homework, "note": note,
    }

LESSONS = [
    # ================= TIỂU HỌC =================
    L("TH-L1", "Hình vuông, hình chữ nhật, tam giác, khối lập phương (Lớp 1)", "HÌNH VUÔNG, HÌNH CHỮ NHẬT; HÌNH TAM GIÁC; HÌNH TRÒN. KHỐI LẬP PHƯƠNG, KHỐI HỘP CHỮ NHẬT",
      ["rect", "platonic", "polygon"], 1,
      ["Nhận biết hình vuông, hình chữ nhật, hình tam giác, hình tròn và khối lập phương, khối hộp.",
       "Đếm được số cạnh, số đỉnh của khối lập phương/khối hộp trên mô hình 3D.",
       "Chỉ ra được đồ vật thật có dạng các hình đã học."],
      ["Quan sát khối lập phương 3D, xoay mô hình và đếm mặt/cạnh/đỉnh.",
       "So sánh khối lập phương với khối hộp chữ nhật bằng cách chuyển mô hình.",
       "Trò chơi 'tìm hình trong lớp học' gắn với từng mô hình."],
      "Tìm 5 đồ vật quanh nhà có dạng khối lập phương hoặc khối hộp chữ nhật.",
      "Mô hình 3D giúp học sinh lớp 1 nhìn khối từ mọi phía — điều tranh vẽ không làm được."),

    L("TH-L2", "Hình tứ giác, hình có ô vuông (Lớp 2)", "HÌNH TỨ GIÁC. HÌNH GỒM NHIỀU Ô VUÔNG",
      ["quad", "polygon"], 2,
      ["Nhận biết hình tứ giác, đếm 4 cạnh 4 đỉnh.", "Biết ghép/tách hình thành các ô vuông."],
      ["Xoay các tứ giác 3D, phân biệt 'phẳng' và 'không phẳng' (tứ giác không đều).",
       "Đếm ô vuông trên mô hình lưới."],
      "Vẽ 3 hình tứ giác khác nhau vào vở.", ""),

    L("TH-L3A", "Chu vi hình tam giác, tứ giác, chữ nhật (Lớp 3)", "CHU VI HÌNH TAM GIÁC, HÌNH TỨ GIÁC, HÌNH CHỮ NHẬT",
      ["triangle", "quad", "rect"], 3,
      ["Tính chu vi bằng cách cộng độ dài các cạnh.", "Kiểm chứng kết quả bằng số đo hiển thị trên mô hình."],
      ["Chọn tam giác 3D, đọc số đo cạnh ở tab Công thức, tính nhẩm chu vi rồi đối chiếu.",
       "So sánh chu vi hai hình có cùng diện tích."],
      "Tính chu vi 3 đồ vật hình chữ nhật trong nhà (mặt bàn, sách, hộp).", ""),

    L("TH-L3B", "Diện tích hình vuông, hình chữ nhật (Lớp 3)", "DIỆN TÍCH HÌNH VUÔNG, DIỆN TÍCH HÌNH CHỮ NHẬT",
      ["rect", "numsys"], 3,
      ["Hiểu diện tích là 'số ô vuông phủ kín hình'.", "Rút ra công thức S = a·b, S = a²."],
      ["Đếm ô vuông trên mô hình lưới đơn vị, so với công thức ở tab Công thức.",
       "Dự đoán diện tích trước khi quay mô hình để kiểm tra."],
      "Đo và tính diện tích mặt chiếc hộp bất kì ở nhà.", ""),

    L("TH-L4A", "Góc nhọn, góc tù, góc vuông; hai đường thẳng vuông góc/song song (Lớp 4)", "GÓC NHỌN, GÓC TÙ, GÓC VUÔNG. HAI ĐƯỜNG THẲNG VUÔNG GÓC. HAI ĐƯỜNG THẲNG SONG SONG",
      ["geoextra", "transform"], 4,
      ["Phân biệt góc nhọn/vuông/tù/bẹt.", "Nhận ra quan hệ vuông góc, song song trên cạnh của khối 3D."],
      ["Tìm các cặp cạnh vuông góc và song song trên khối hộp 3D (xoay để thấy cả 3 chiều).",
       "Ước lượng số đo góc rồi kiểm tra bằng mô hình góc."],
      "Liệt kê 3 cặp cạnh song song trong phòng học.", ""),

    L("TH-L4B", "Phân số và phép cộng/trừ phân số (Lớp 4)", "PHÂN SỐ. PHÉP CỘNG PHÂN SỐ. PHÉP TRỪ PHÂN SỐ",
      ["fractionpie"], 4,
      ["Đọc – viết phân số từ hình trực quan.", "Cộng trừ cùng mẫu số nhờ mô hình tròn/phân chia."],
      ["Xem mô hình fractionpie, diễn đạt phần tô màu bằng phân số.",
       "Ghép hai mô hình để thấy 1/2 + 1/4 = 3/4 một cách trực quan."],
      "Viết phân số chỉ phần đã tô màu của 3 đồ vật em cắt đôi/tư.", ""),

    L("TH-L5A", "Nhân/chia phân số; hỗn số (Lớp 5)", "NHÂN PHÂN SỐ. CHIA PHÂN SỐ. HỖN SỐ",
      ["fractionpie", "numsys"], 5,
      ["Minh hoạ phép nhân phân số bằng 'diện tích phần giao'.", "Chuyển hỗn số ↔ phân số."],
      ["Dùng 2 mô hình fractionpie chồng lớp để giải thích 1/2 × 1/3 = 1/6.",
       "Đọc tỉ lệ trên mô hình kim tự tháp/ cột phân số."],
      "Giải thích cho bố mẹ phép nhân phân số bằng một mô hình 3D.", ""),

    L("TH-L5B", "Hình tam giác, hình thang; diện tích hình tam giác, hình thang (Lớp 5)", "HÌNH TAM GIÁC, HÌNH THANG. DIỆN TÍCH HÌNH TAM GIÁC. DIỆN TÍCH HÌNH THANG",
      ["triangle", "quad"], 5,
      ["Phát biểu đáy – chiều cao của tam giác, hình thang.", "Suy ra công thức S từ việc 'ghép hình'."],
      ["Xoay tam giác 3D để chỉ ra chiều cao rơi ngoài/trong hình.",
       "Đối chiếu S tính tay với S ở tab Công thức."],
      "Tính diện tích một mảnh đất hình thang (số liệu tự đặt).", ""),

    L("TH-L5C", "Hình tròn, chu vi & diện tích hình tròn (Lớp 5)", "HÌNH TRÒN. CHU VI HÌNH TRÒN, DIỆN TÍCH HÌNH TRÒN",
      ["polygon", "revolution"], 5,
      ["Hiểu π ≈ 3,14 qua đa giác nội tiếp ngoại tiếp.", "Tính C = 2πr, S = πr²."],
      ["Tăng dần số cạnh đa giác nội tiếp để thấy nó 'hoá' thành hình tròn.",
       "Đo chu vi bánh xe thật rồi đối chiếu mô hình."],
      "Tính diện tích mặt đồng hồ tròn ở nhà (đo bán kính).", ""),

    L("TH-L5D", "Thể tích hình lập phương, hình hộp chữ nhật (Lớp 5)", "XĂNG-TI-MÉT KHỐI. ĐỀ-XI-MÉT KHỐI. ME-T KHỐI. THỂ TÍCH HÌNH LẬP PHƯƠNG, HÌNH HỘP CHỮ NHẬT",
      ["platonic", "prism", "numsys"], 5,
      ["Hình dung 1 cm³ là một ô lập phương đơn vị.", "Tính V = a³ và V = a·b·c, đếm ô đơn vị."],
      ["Xem khối lập phương xếp bởi ô đơn vị, đếm theo hàng–cột–lớp.",
       "So sánh thể tích hai hộp có cùng chu vi đáy."],
      "Ước lượng số hộp sữa 200ml vừa đầy một thùng 20×20×20 cm.", ""),

    # ================= THCS (TOÁN 6) =================
    L("TC-6A", "Hình tam giác đều, hình vuông, lục giác đều (Toán 6 CTST/KNTT)", "HÌNH TAM GIÁC ĐỀU, HÌNH VUÔNG, HÌNH LỤC GIÁC ĐỀU",
      ["polygon", "platonic"], 6,
      ["Nhận biết đặc trưng cạnh/góc của tam giác đều, vuông, lục giác đều.", "Xếp được khai triển giấy của khối liên quan."],
      ["In khai triển từ tab Gấp/Mở, cắt và gấp thành khối thật.",
       "Đếm trục đối xứng bằng cách xoay mô hình."],
      "Chụp ảnh sản phẩm giấy gấp được và đối chiếu với mô hình 3D.", ""),

    L("TC-6B", "Hình chữ nhật, thoi, bình hành, thang cân (Toán 6)", "HÌNH CHỮ NHẬT, HÌNH THOI, HÌNH BÌNH HÀNH, HÌNH THANG CÂN",
      ["quad", "rect"], 6,
      ["Phân biệt tứ giác đặc biệt theo cạnh song song và cạnh bên.", "Dự đoán thiết diện của khối hộp."],
      ["Xoay khối hộp, kéo thanh trượt Mặt cắt để thấy thiết diện là thoi/hình thang cân.",
       "Đo đường chéo thoi trên mô hình."],
      "Vẽ 4 tứ giác đã học vào vở, ghi đặc điểm mỗi hình.", ""),

    L("TC-6C", "Góc; số đo góc (Toán 6)", "GÓC. SỐ ĐO GÓC",
      ["geoextra"], 6,
      ["Đọc số đo góc nhọn/vuông/tù/bẹt.", "Dùng mô hình góc để ước lượng rồi kiểm chứng."],
      ["So sánh 2 góc bằng cách xoay mô hình về cùng hướng.", "Tìm góc trong bảng đồng hồ 3D."],
      "Đo góc mở của cánh cửa bằng ê-ke rồi so với ước lượng.", ""),

    # ================= TOÁN 7 =================
    L("TC-7A", "Tam giác; tổng ba góc; các trường hợp bằng nhau (Toán 7)", "ĐỊNH LÝ PYTHAGORE. CÁC TRƯỜNG HỢP BẰNG NHAU CỦA TAM GIÁC",
      ["triangle", "geoextra"], 7,
      ["Chứng minh tổng ba góc = 180° bằng cách 'trải' ba góc ra đường thẳng.",
       "Phát biểu 3 trường hợp bằng nhau của tam giác.", "Kiểm nghiệm định lý Pythagore."],
      ["Xoay tam giác 3D, quan sát 3 góc ghép thành góc bẹt.",
       "Dựng tam giác từ 3 dữ kiện (c-c-c, c-g-c, g-c-g) trên mô hình.",
       "Xem mô hình Vuông-A+B-C chứng minh Pythagore bằng diện tích."],
      "Cho tam giác có 2 cạnh 6, 8 và góc vuông xen giữa — tính cạnh huyền rồi kiểm tra bằng tab Công thức.", ""),

    L("TC-7B", "Tỉ lệ thức; dãy số bằng nhau (Liên hệ chủ đề Số học)", "TỈ LỆ THỨC. TÍNH CHẤT CỦA DÃY SỐ BẰNG NHAU",
      ["numsys", "stats"], 7,
      ["Viết tỉ lệ thức từ số liệu trên mô hình cột/bar.", "Rút gọn và kiểm tra a/b = c/d."],
      ["Đọc chiều cao 2 cột trên mô hình thống kê, lập tỉ số.", "Đối chiếu phần trăm trên mô hình pie."],
      "", ""),

    # ================= TOÁN 8 =================
    L("TC-8A", "Đa thức; hằng đẳng thức bằng mô hình khối (Toán 8)", "ĐA THỨC. HẰNG ĐẲNG THỨC ĐÁNG NHỚ",
      ["numsys", "rect", "prism"], 8,
      ["Nhìn (a+b)² = a²+2ab+b² trên mô hình ô vuông.", "Tổng quát hoá bằng lập luận diện tích/tích khối."],
      ["Tách mô hình ô vuông (a+b)×(a+b) thành 4 vùng.", "Ghép khối hộp minh hoạ (a+b)³ nếu có mô hình lập phương đơn vị."],
      "Dùng mô hình để giải thích (a−b)² cho bạn cùng bàn.", ""),

    L("TC-8B", "Hình chóp tam giác đều, tứ giác đều (Toán 8 KNTT)", "HÌNH CHÓP TAM GIÁC ĐỀU. HÌNH CHÓP TỨ GIÁC ĐỀU",
      ["pyramid", "net"], 8,
      ["Định nghĩa đáy, mặt bên, trung đoạn, chiều cao.", "Tính Sxq = p·d và thể tích V = ⅓·S·h.", "In – gấp khai triển hình chóp."],
      ["Tab Gấp/Mở: xem khai triển, in ra giấy, gấp thành kim tự tháp.",
       "Tab Mặt cắt: cắt ngang → tam giác/ngũ giác đồng dạng đáy; cắt dọc → tam giác cân.",
       "Tab Công thức: đọc Sxq, V rồi tự tính lại với số đo riêng."],
      "Tính thể tích mô hình kim tự tháp giấy em gấp (đo cạnh thực tế).", "Kim tự tháp Ai Cập, mái che — dẫn dắt ứng dụng thực tế."),

    # ================= TOÁN 9 =================
    L("TC-9A", "Hình trụ (Toán 9)", "HÌNH TRỤ. DIỆN TÍCH XUNG QUANH VÀ THỂ TÍCH HÌNH TRỤ",
      ["cylinder", "revolution"], 9,
      ["Nhận biết đáy, trục, đường sinh.", "Tính Sxq = 2πrh, V = πr²h.", "Mô tả khai triển: hình chữ nhật + 2 hình tròn."],
      ["Quay nhanh mô hình trụ → tưởng tượng quá trình tạo thành bằng cách quay hình chữ nhật.",
       "In khai triển, cuộn giấy thành trụ, đo để kiểm chứng 2πr.",
       "Kéo Mặt cắt: ngang → hình tròn, dọc → hình chữ nhật."],
      "Tính thể tích một lon sữa bò (đo r, h thực tế).", ""),

    L("TC-9B", "Hình nón, hình cầu (Toán 9)", "HÌNH NÓN. HÌNH CẦU. DIỆN TÍCH BỀ MẶT VÀ THỂ TÍCH HÌNH NÓN, HÌNH CẦU",
      ["cone", "sphere", "torus"], 9,
      ["Tính Sxq nón = πrl, V = ⅓πr²h.", "Công thức mặt cầu 4πR², khối cầu ⁴⁄₃πR³.", "So sánh tỉ lệ thể tích nón – trụ – cầu cùng kích thước."],
      ["Thiết diện nón: ngang → hình tròn nhỏ dần; dọc → tam giác cân.",
       "Xem mô hình 'nón chứa trong trụ' để nhớ hệ số 1/3.", "Bóng đá/bản đồ Trái Đất → mô hình mặt cầu."],
      "Một chiếc mũ sinh nhật hình nón: tính diện tích giấy cần dùng.", ""),

    # ================= TOÁN 10 =================
    L("TH-10A", "Vectơ; tổng hiệu vectơ (Toán 10)", "VECTƠ. TỔNG VÀ HIỆU HAI VECTƠ. QUY TẮC BA ĐIỂM, HÌNH BÌNH HÀNH",
      ["vector"], 10,
      ["Biểu diễn vectơ trong không gian, cộng theo quy tắc hình bình hành.", "Phân tích một vectơ theo 2 vectơ không cùng phương."],
      ["Xoay mô hình vectơ để thấy phép cộng 3D.", "Mô phỏng lực: 2 lực tác động lên 1 vật → hợp lực."],
      "", ""),

    L("TH-10B", "Các số đặc trưng của mẫu; biểu đồ (Toán 10)", "SỐ TRUNG BÌNH CỘNG. TRUNG VỊ. MỐT. ĐỘ LỆCH CHUẨN. BIỂU ĐỒ",
      ["stats"], 10,
      ["Đọc mean/median/mode/std từ mô hình biểu đồ.", "Liên kết chiều cao cột với tần số dữ liệu."],
      ["Chọn mô hình bar/histogram, đọc bảng số liệu ở tab Công thức, tự tính lại mean.",
       "So sánh 2 biểu đồ cùng trung bình nhưng khác độ lệch chuẩn."],
      "Khảo sát điểm thi của tổ mình và dựng biểu đồ trên giấy.", ""),

    # ================= TOÁN 11 =================
    L("TH-11A", "Hàm số lượng giác; đồ thị sin, cos (Toán 11)", "HÀM SỐ LƯỢNG GIÁC. ĐỒ THỊ HÀM SỐ LƯỢNG GIÁC",
      ["polarcurve", "graph2d", "surfacefn"], 11,
      ["Liên hệ đường tròn lượng giác với đồ thị sóng sin.", "Đọc chu kỳ, biên độ, pha từ đồ thị 3D.", "Nhận diện đường cong Lissajous"],
      ["Xem mô hình 'vòng tròn tạo sóng': hình chiếu của chuyển động tròn là sin.",
       "Đổi biên độ/chu kỳ qua các mô hình liền kề, nhận xét sự biến thiên."],
      "Vẽ đồ thị y = sin(x + π/3) bằng cách quan sát mô hình tương ứng.", ""),

    L("TH-11B", "Mặt nón – mặt trụ trong không gian; thiết diện (Toán 11-12)", "MẶT NÓN TRÒN XOAY. MẶT TRỤ TRÒN XOAY. THIẾT DIỆN",
      ["cone", "cylinder", "revolution"], 11,
      ["Mô tả mặt nón/trụ như quỹ đạo đường sinh.", "Dự đoán thiết diện khi mặt phẳng cắt nón (elip, parabol, hypebol)."],
      ["Kéo Mặt cắt nghiêng trên nón → xuất hiện conic.", "So sánh thiết diện trụ và nón cùng độ nghiêng."],
      "", "Chủ đề này là cầu nối sang mặt bậc hai (Toán 12)."),

    # ================= TOÁN 12 =================
    L("TH-12A", "Khối đa diện; lăng trụ và chóp (Toán 12)", "KHỐI LĂNG TRỤ. KHỐI CHÓP. KHỐI ĐA DIỆN ĐỀU. CÔNG THỨC THỂ TÍCH KHỐI ĐA DIỆN",
      ["platonic", "prism", "pyramid"], 12,
      ["Đếm đỉnh–cạnh–mặt, kiểm chứng Euler V−E+F=2.", "Tính thể tích khối chóp/lăng trụ theo công thức tổng quát.", "Ca-vét năm khối đa diện đều."],
      ["Tab Công thức: đối chiếu số đỉnh/cạnh/mặt của từng khối.",
       "Cắt ngang khối chóp → khối chóp cụt đồng dạng; suy luận tỉ lệ thể tích.",
       "In khai triển 5 khối đều, gấp và kiểm tra số mặt."],
      "Chứng minh thể tích bát diện đều cạnh a bằng 2 lần khối chóp tứ giác đều.", ""),

    L("TH-12B", "Mặt tròn xoay: nón, trụ, cầu (Toán 12)", "MẶT NÓN. MẶT TRỤ. MẶT CẦU. DIỆN TÍCH VÀ THỂ TÍCH KHỐI TRÒN XOAY",
      ["cone", "cylinder", "sphere", "torus"], 12,
      ["Thiết lập công thức diện tích – thể tích mặt tròn xoay.", "Mô tả giao của mặt cầu và mặt phẳng (đường tròn nhỏ)."],
      ["Kéo Mặt cắt qua mặt cầu: thấy thiết diện luôn là hình tròn, bán kính thay đổi.",
       "Nội tiếp – ngoại tiếp: chóp trong trụ trong cầu."],
      "Tính thể tích phần mặt cầu bị cắt bởi 2 mặt phẳng song song (chỏm cầu).", ""),

    L("TH-12C", "Toạ độ Oxyz; mặt cầu, mặt phẳng, mặt trụ (Toán 12)", "PHƯƠNG TRÌNH MẶT CẦU. PHƯƠNG TRÌNH MẶT PHẲNG. PHƯƠNG TRÌNH MẶT TRỤ. MẶT BẬC HAI",
      ["quadsurface", "paramsurface", "vector", "sphere"], 12,
      ["Đọc phương trình từ dạng hình học: elipxoid, paraboloid, hyperboloid.", "Viết pt mặt cầu tâm I bán kính R.", "Nhận diện mặt 1 chiều (trụ) và thiết diện."],
      ["Xoay hyperboloid 1 tầng: thấy các đường thẳng nằm trọn trên mặt (ruled).",
       "Gán phương trình ↔ mô hình bằng tab Công thức.",
       "Mặt cắt elipxoid theo 3 hướng → 3 elip khác nhau."],
      "Viết phương trình mặt ellipxoid có bán trục 3, 2, 1 và mô tả thiết diện z=0.", ""),

    L("TH-KN", "Giải tích mở rộng: tích phân, chuỗi Fourier, fractal (Câu lạc bộ Toán/NCKH)", "TÍCH PHÂN. TỔNG RIEMANN. CHUỖI FOURIER. FRACTAL. TOÁN ỨNG DỤNG",
      ["surfacefn", "fractal", "misc", "graph2d"], 11,
      ["Hiểu tích phân qua các hộp Riemann 3D.", "Đọc phổ Fourier của tín hiệu tuần hoàn.", "Số chiều fractal và giới hạn tự đồng dạng."],
      ["Tăng số hộp Riemann → diện tích hội tụ.", "Xem Chuỗi Fourier xấp xỉ hàm vuông.",
       "Tính tỉ lệ tự đồng dạng của Cantor/Sierpinski/Menger."],
      "Chọn 1 mô hình yêu thích, viết 200 dòng giải thích nó cho học sinh lớp dưới.", ""),
]

THEMES = [
    {"code": "T1", "name": "Hình học trực quan nền tảng", "desc": "Từ hình phẳng tới khối 3D đầu tiên — mạch Tiểu học lớp 1-5.",
     "lessons": ["TH-L1", "TH-L2", "TH-L3A", "TH-L3B", "TH-L4A", "TH-L5B", "TH-L5C", "TH-L5D"]},
    {"code": "T2", "name": "Số học & Phân số", "desc": "Hệ đếm, phân số, tỉ lệ — dùng mô hình số học 3D.",
     "lessons": ["TH-L4B", "TH-L5A", "TC-6B", "TC-8A"]},
    {"code": "T3", "name": "Đa giác & Tứ giác", "desc": "Tam giác, tứ giác, góc, đối xứng.",
     "lessons": ["TH-L4A", "TC-6A", "TC-6B", "TC-6C", "TC-7A"]},
    {"code": "T4", "name": "Khối đa diện", "desc": "Lăng trụ, chóp, khối đều — mạch chính Hình học 8 & 12.",
     "lessons": ["TC-8B", "TH-12A", "TH-L5D"]},
    {"code": "T5", "name": "Mặt tròn xoay", "desc": "Tròn, trụ, nón, cầu, xuyến — Toán 9 & 12.",
     "lessons": ["TH-L5C", "TC-9A", "TC-9B", "TH-12B"]},
    {"code": "T6", "name": "Hàm số & Đồ thị", "desc": "Đồ thị 2D/3D, biến đổi, lượng giác.",
     "lessons": ["TH-11A", "TH-11B", "TH-KN"]},
    {"code": "T7", "name": "Vectơ & Không gian toạ độ", "desc": "Vectơ, Oxyz, mặt bậc hai.",
     "lessons": ["TH-10A", "TH-12C"]},
    {"code": "T8", "name": "Thống kê & Xác suất", "desc": "Biểu đồ, số đặc trưng, biến cố.",
     "lessons": ["TH-10B", "TC-7B"]},
    {"code": "T9", "name": "Fractal & Toán nâng cao", "desc": "Tự đồng dạng, chiều fractal, chủ đề câu lạc bộ.",
     "lessons": ["TH-KN"]},
]

BLOCK_ALIAS = {  # từ khoá khớp tên category/kind của models.json
    "platonic": ["Khối đa diện"], "prism": ["Khối đa diện"], "pyramid": ["Khối đa diện"],
    "rect": ["Hình phẳng"], "quad": ["Hình phẳng"], "triangle": ["Hình phẳng"], "polygon": ["Hình phẳng"],
    "cylinder": ["Mặt tròn xoay"], "cone": ["Mặt tròn xoay"], "sphere": ["Mặt tròn xoay"],
    "torus": ["Mặt tròn xoay"], "revolution": ["Mặt tròn xoay"],
    "fractionpie": ["Số học", "Phân số"], "numsys": ["Số học"],
    "transform": ["Hình học biến đổi"], "graph2d": ["Hàm số"], "polarcurve": ["Hàm lượng giác"],
    "surfacefn": ["Giải tích", "Hàm số"], "quadsurface": ["Nâng cao", "Mặt bậc hai"],
    "paramsurface": ["Nâng cao"], "fractal": ["Fractal"], "vector": ["Vectơ"],
    "stats": ["Thống kê"], "prob": ["Xác suất"], "misc": ["Ứng dụng thực tế", "Nâng cao", "Công nghệ 3D"],
    "geoextra": ["Hình phẳng", "Ứng dụng thực tế", "Nâng cao"], "torusknot": ["Nâng cao", "Fractal"],
}

LEVEL_BY_GRADE = lambda g: "Tiểu học" if g <= 5 else ("Trung học")


def main():
    data = {
        "version": 1,
        "updated": "2026-10-27",
        "source": "Chương trình GDPT 2018 (các mạch hình học/số học/thống kê)",
        "themes": THEMES,
        "lessons": LESSONS,
        "blockAlias": BLOCK_ALIAS,
    }
    out = os.path.join(HERE, "curriculum.json")
    with open(out, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=1)
    print(f"Wrote {out}: {len(THEMES)} themes, {len(LESSONS)} lessons")


if __name__ == "__main__":
    main()
