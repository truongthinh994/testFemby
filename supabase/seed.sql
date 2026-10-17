-- Original sample content. Re-runnable seed; no official TOEIC material.
begin;
insert into public.topics(id,title,description) values
('office','Office & Business','Từ vựng thường gặp trong môi trường làm việc.'),
('travel','Travel & Transport','Giao tiếp khi đi công tác và di chuyển.'),
('finance','Finance & Banking','Nắm vững từ vựng tài chính cơ bản.')
on conflict (id) do update set title=excluded.title,description=excluded.description;
insert into public.words(id,topic_id,word,pronunciation,meaning,example,audio_url) values
('office-01','office','negotiate','/nɪˈɡoʊʃieɪt/','thương lượng','We need to negotiate the contract.','/audio/office-01.wav'),
('office-02','office','contract','/ˈkɑːntrækt/','hợp đồng','Please sign the contract today.','/audio/office-02.wav'),
('office-03','office','colleague','/ˈkɑːliːɡ/','đồng nghiệp','My colleague works in sales.','/audio/office-03.wav'),
('office-04','office','agenda','/əˈdʒendə/','chương trình họp','The agenda includes three topics.','/audio/office-04.wav'),
('office-05','office','deadline','/ˈdedlaɪn/','hạn chót','The deadline is Friday.','/audio/office-05.wav'),
('office-06','office','meeting','/ˈmiːtɪŋ/','cuộc họp','The meeting starts at nine.','/audio/office-06.wav'),
('office-07','office','report','/rɪˈpɔːrt/','báo cáo','I sent the monthly report.','/audio/office-07.wav'),
('office-08','office','approve','/əˈpruːv/','phê duyệt','The director will approve the plan.','/audio/office-08.wav'),
('office-09','office','schedule','/ˈskedʒuːl/','lịch trình','Check the schedule before lunch.','/audio/office-09.wav'),
('office-10','office','department','/dɪˈpɑːrtmənt/','phòng ban','Our department is on the third floor.','/audio/office-10.wav'),
('travel-01','travel','itinerary','/aɪˈtɪnəreri/','lịch trình chuyến đi','Your itinerary includes two cities.','/audio/travel-01.wav'),
('travel-02','travel','departure','/dɪˈpɑːrtʃər/','sự khởi hành','Departure is at six.','/audio/travel-02.wav'),
('travel-03','travel','arrival','/əˈraɪvəl/','sự đến nơi','We expect your arrival tomorrow.','/audio/travel-03.wav'),
('travel-04','travel','reservation','/ˌrezərˈveɪʃən/','sự đặt chỗ','I have a hotel reservation.','/audio/travel-04.wav'),
('travel-05','travel','luggage','/ˈlʌɡɪdʒ/','hành lý','Keep your luggage with you.','/audio/travel-05.wav'),
('travel-06','travel','platform','/ˈplætfɔːrm/','sân ga','The train leaves from platform two.','/audio/travel-06.wav'),
('travel-07','travel','destination','/ˌdestɪˈneɪʃən/','điểm đến','Our destination is London.','/audio/travel-07.wav'),
('travel-08','travel','fare','/fer/','giá vé','The bus fare is two dollars.','/audio/travel-08.wav'),
('travel-09','travel','delay','/dɪˈleɪ/','sự chậm trễ','There is a short delay.','/audio/travel-09.wav'),
('travel-10','travel','boarding','/ˈbɔːrdɪŋ/','việc lên máy bay','Boarding begins in ten minutes.','/audio/travel-10.wav'),
('finance-01','finance','revenue','/ˈrevənuː/','doanh thu','Revenue increased this year.','/audio/finance-01.wav'),
('finance-02','finance','budget','/ˈbʌdʒɪt/','ngân sách','The budget covers new equipment.','/audio/finance-02.wav'),
('finance-03','finance','invoice','/ˈɪnvɔɪs/','hóa đơn','Please pay the invoice by Monday.','/audio/finance-03.wav'),
('finance-04','finance','expense','/ɪkˈspens/','chi phí','Travel is our largest expense.','/audio/finance-04.wav'),
('finance-05','finance','profit','/ˈprɑːfɪt/','lợi nhuận','The company earned a profit.','/audio/finance-05.wav'),
('finance-06','finance','deposit','/dɪˈpɑːzɪt/','tiền đặt cọc','A deposit is required.','/audio/finance-06.wav'),
('finance-07','finance','balance','/ˈbæləns/','số dư','Check your account balance.','/audio/finance-07.wav'),
('finance-08','finance','refund','/ˈriːfʌnd/','tiền hoàn lại','You will receive a full refund.','/audio/finance-08.wav'),
('finance-09','finance','payment','/ˈpeɪmənt/','khoản thanh toán','Payment is due next week.','/audio/finance-09.wav'),
('finance-10','finance','interest','/ˈɪntrəst/','tiền lãi','This account earns interest.','/audio/finance-10.wav')
on conflict (id) do update set topic_id=excluded.topic_id,word=excluded.word,pronunciation=excluded.pronunciation,meaning=excluded.meaning,example=excluded.example,audio_url=excluded.audio_url;
insert into public.exams(id,title,duration_seconds) values
('mini-01','Mini test 01','1200')
on conflict (id) do update set title=excluded.title,duration_seconds=excluded.duration_seconds;
insert into public.question_groups(id,exam_id,section,passage,audio_url) values
('group-01','mini-01','Listening',null,'/audio/group-01.wav'),
('group-02','mini-01','Listening',null,'/audio/group-02.wav'),
('group-03','mini-01','Listening',null,'/audio/group-03.wav'),
('group-04','mini-01','Listening',null,'/audio/group-04.wav'),
('group-05','mini-01','Listening',null,'/audio/group-05.wav'),
('group-06','mini-01','Listening',null,'/audio/group-06.wav'),
('group-07','mini-01','Listening',null,'/audio/group-07.wav'),
('group-08','mini-01','Listening',null,'/audio/group-08.wav'),
('group-09','mini-01','Listening',null,'/audio/group-09.wav'),
('group-10','mini-01','Listening',null,'/audio/group-10.wav'),
('group-11','mini-01','Reading',null,null),
('group-12','mini-01','Reading',null,null),
('group-13','mini-01','Reading',null,null),
('group-14','mini-01','Reading',null,null),
('group-15','mini-01','Reading',null,null),
('group-16','mini-01','Reading','NOTICE: The library will close at 4 p.m. on Friday for staff training. Normal hours resume on Saturday.',null),
('group-17','mini-01','Reading','EMAIL: Dear Alex, please bring twenty copies of the proposal to our meeting on Tuesday. We will meet in Room 304 at 10 a.m.',null),
('group-18','mini-01','Reading','ADVERTISEMENT: Join our fitness center this month and receive your first two personal training sessions free. The offer ends April 30.',null),
('group-19','mini-01','Reading','POLICY: Customers may return unused items within fourteen days of purchase. A receipt is required.',null),
('group-20','mini-01','Reading','MEMO: The marketing team will move to the fifth floor next Monday. Their phone numbers will remain unchanged.',null)
on conflict (id) do update set exam_id=excluded.exam_id,section=excluded.section,passage=excluded.passage,audio_url=excluded.audio_url;
insert into public.questions(id,exam_id,group_id,position,prompt,options) values
('q-01','mini-01','group-01','1','When should the report be sent?','["Before 3 p.m.","At 4 p.m.","Tomorrow morning","Next week"]'),
('q-02','mini-01','group-02','2','Which platform should passengers use?','["Two","Four","Six","Eight"]'),
('q-03','mini-01','group-03','3','Why will the office be closed?','["A holiday","Maintenance","A conference","Bad weather"]'),
('q-04','mini-01','group-04','4','What is the caller confirming?','["A canceled flight","A restaurant order","A payment error","A room is ready"]'),
('q-05','mini-01','group-05','5','Who can help with the printer?','["Daniel","The receptionist","The director","A customer"]'),
('q-06','mini-01','group-06','6','When should participants arrive?','["9:00","9:15","9:30","9:45"]'),
('q-07','mini-01','group-07','7','Which chairs are available?','["Blue","Red","Gray","White"]'),
('q-08','mini-01','group-08','8','When does the bank close on Saturday?','["At noon","At five","At six","At nine"]'),
('q-09','mini-01','group-09','9','What does the speaker offer?','["A discount on another order","A store membership","A longer warranty","A free replacement"]'),
('q-10','mini-01','group-10','10','On which day is the team lunch?','["Tuesday","Wednesday","Thursday","Friday"]'),
('q-11','mini-01','group-11','11','The manager asked everyone to submit reports _____ Friday.','["by","since","during","at"]'),
('q-12','mini-01','group-12','12','Ms. Lee is responsible _____ organizing the conference.','["to","for","at","with"]'),
('q-13','mini-01','group-13','13','The new software works more _____ than the old version.','["efficient","efficiency","efficiently","efficiencies"]'),
('q-14','mini-01','group-14','14','All visitors must _____ at the reception desk.','["register","registered","registering","registration"]'),
('q-15','mini-01','group-15','15','The shipment was delayed _____ heavy snow.','["although","despite","unless","because of"]'),
('q-16','mini-01','group-16','16','Why will the library close early?','["Building repairs","Staff training","A public holiday","A book sale"]'),
('q-17','mini-01','group-17','17','What should Alex bring?','["A laptop","A room key","Twenty copies","Ten reports"]'),
('q-18','mini-01','group-18','18','What is offered for free?','["Two training sessions","A year of membership","Sports clothing","Parking for a year"]'),
('q-19','mini-01','group-19','19','What must customers provide?','["A photograph","A membership card","A warranty","A receipt"]'),
('q-20','mini-01','group-20','20','What will stay the same?','["The floor","The phone numbers","The office furniture","The meeting schedule"]')
on conflict (id) do update set exam_id=excluded.exam_id,group_id=excluded.group_id,position=excluded.position,prompt=excluded.prompt,options=excluded.options;
insert into private.answer_keys(question_id,correct,explanation,transcript) values
('q-01','0','Người nói yêu cầu gửi báo cáo trước 3 giờ chiều.','Please send the sales report before three this afternoon. The manager needs it for a meeting at four.'),
('q-02','2','Thông báo đổi sân ga từ số 2 sang số 6.','Attention passengers. The train to Oxford will leave from platform six instead of platform two.'),
('q-03','1','Văn phòng đóng cửa để bảo trì, không phải nghỉ lễ.','Our office will be closed on Monday for maintenance. Employees should work from home that day.'),
('q-04','3','Khách sạn xác nhận phòng đã sẵn sàng.','Hello, this is Green Hotel. Your room is ready. You may check in any time after two o clock.'),
('q-05','0','Người nói chỉ định Daniel ở phòng IT.','The new printer is near the reception desk. If you need help using it, ask Daniel in the IT department.'),
('q-06','1','9 giờ 30 trừ 15 phút là 9 giờ 15.','The workshop begins at nine thirty. Please arrive fifteen minutes early to collect your name badge.'),
('q-07','2','Ghế xanh đã hết; mẫu màu xám còn hàng.','We have sold all the blue chairs, but the gray model is still available. Delivery takes three working days.'),
('q-08','0','Chi nhánh đóng cửa vào buổi trưa thứ Bảy.','Thank you for calling City Bank. Our branch is open until five on weekdays and until noon on Saturdays.'),
('q-09','3','Người nói đề nghị thay thế miễn phí.','Your order arrived with one damaged item. We can replace it free of charge. Please keep the original packaging.'),
('q-10','2','Bữa trưa được chuyển sang thứ Năm.','The team lunch has been moved to Thursday because our client will visit on Wednesday. We will meet at the cafe downstairs.'),
('q-11','0','“By Friday” chỉ hạn chót: chậm nhất vào thứ Sáu.',null),
('q-12','1','Cụm cố định “be responsible for” nghĩa là chịu trách nhiệm về.',null),
('q-13','2','Sau động từ “works” cần trạng từ “efficiently”.',null),
('q-14','0','Sau “must” là động từ nguyên mẫu.',null),
('q-15','3','“Because of” đi với cụm danh từ “heavy snow” để chỉ nguyên nhân.',null),
('q-16','1','Thông báo nêu rõ lý do là đào tạo nhân viên.',null),
('q-17','2','Email yêu cầu 20 bản sao của đề xuất.',null),
('q-18','0','Ưu đãi là hai buổi tập cá nhân đầu tiên miễn phí.',null),
('q-19','3','Chính sách yêu cầu hóa đơn để trả hàng.',null),
('q-20','1','“Remain unchanged” nghĩa là không thay đổi; ở đây là số điện thoại.',null)
on conflict (question_id) do update set correct=excluded.correct,explanation=excluded.explanation,transcript=excluded.transcript;
commit;
