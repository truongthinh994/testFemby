import {mkdirSync,writeFileSync} from 'node:fs';
const groups=[
 ['office','Office & Business','Từ vựng thường gặp trong môi trường làm việc.',[
 ['negotiate','/nɪˈɡoʊʃieɪt/','thương lượng','We need to negotiate the contract.'],
 ['contract','/ˈkɑːntrækt/','hợp đồng','Please sign the contract today.'],
 ['colleague','/ˈkɑːliːɡ/','đồng nghiệp','My colleague works in sales.'],
 ['agenda','/əˈdʒendə/','chương trình họp','The agenda includes three topics.'],
 ['deadline','/ˈdedlaɪn/','hạn chót','The deadline is Friday.'],
 ['meeting','/ˈmiːtɪŋ/','cuộc họp','The meeting starts at nine.'],
 ['report','/rɪˈpɔːrt/','báo cáo','I sent the monthly report.'],
 ['approve','/əˈpruːv/','phê duyệt','The director will approve the plan.'],
 ['schedule','/ˈskedʒuːl/','lịch trình','Check the schedule before lunch.'],
 ['department','/dɪˈpɑːrtmənt/','phòng ban','Our department is on the third floor.']]],
 ['travel','Travel & Transport','Giao tiếp khi đi công tác và di chuyển.',[
 ['itinerary','/aɪˈtɪnəreri/','lịch trình chuyến đi','Your itinerary includes two cities.'],
 ['departure','/dɪˈpɑːrtʃər/','sự khởi hành','Departure is at six.'],
 ['arrival','/əˈraɪvəl/','sự đến nơi','We expect your arrival tomorrow.'],
 ['reservation','/ˌrezərˈveɪʃən/','sự đặt chỗ','I have a hotel reservation.'],
 ['luggage','/ˈlʌɡɪdʒ/','hành lý','Keep your luggage with you.'],
 ['platform','/ˈplætfɔːrm/','sân ga','The train leaves from platform two.'],
 ['destination','/ˌdestɪˈneɪʃən/','điểm đến','Our destination is London.'],
 ['fare','/fer/','giá vé','The bus fare is two dollars.'],
 ['delay','/dɪˈleɪ/','sự chậm trễ','There is a short delay.'],
 ['boarding','/ˈbɔːrdɪŋ/','việc lên máy bay','Boarding begins in ten minutes.']]],
 ['finance','Finance & Banking','Nắm vững từ vựng tài chính cơ bản.',[
 ['revenue','/ˈrevənuː/','doanh thu','Revenue increased this year.'],
 ['budget','/ˈbʌdʒɪt/','ngân sách','The budget covers new equipment.'],
 ['invoice','/ˈɪnvɔɪs/','hóa đơn','Please pay the invoice by Monday.'],
 ['expense','/ɪkˈspens/','chi phí','Travel is our largest expense.'],
 ['profit','/ˈprɑːfɪt/','lợi nhuận','The company earned a profit.'],
 ['deposit','/dɪˈpɑːzɪt/','tiền đặt cọc','A deposit is required.'],
 ['balance','/ˈbæləns/','số dư','Check your account balance.'],
 ['refund','/ˈriːfʌnd/','tiền hoàn lại','You will receive a full refund.'],
 ['payment','/ˈpeɪmənt/','khoản thanh toán','Payment is due next week.'],
 ['interest','/ˈɪntrəst/','tiền lãi','This account earns interest.']]]
];
const listening=[
 ['Please send the sales report before three this afternoon. The manager needs it for a meeting at four.','When should the report be sent?',['Before 3 p.m.','At 4 p.m.','Tomorrow morning','Next week'],0,'Người nói yêu cầu gửi báo cáo trước 3 giờ chiều.'],
 ['Attention passengers. The train to Oxford will leave from platform six instead of platform two.','Which platform should passengers use?',['Two','Four','Six','Eight'],2,'Thông báo đổi sân ga từ số 2 sang số 6.'],
 ['Our office will be closed on Monday for maintenance. Employees should work from home that day.','Why will the office be closed?',['A holiday','Maintenance','A conference','Bad weather'],1,'Văn phòng đóng cửa để bảo trì, không phải nghỉ lễ.'],
 ['Hello, this is Green Hotel. Your room is ready. You may check in any time after two o clock.','What is the caller confirming?',['A canceled flight','A restaurant order','A payment error','A room is ready'],3,'Khách sạn xác nhận phòng đã sẵn sàng.'],
 ['The new printer is near the reception desk. If you need help using it, ask Daniel in the IT department.','Who can help with the printer?',['Daniel','The receptionist','The director','A customer'],0,'Người nói chỉ định Daniel ở phòng IT.'],
 ['The workshop begins at nine thirty. Please arrive fifteen minutes early to collect your name badge.','When should participants arrive?',['9:00','9:15','9:30','9:45'],1,'9 giờ 30 trừ 15 phút là 9 giờ 15.'],
 ['We have sold all the blue chairs, but the gray model is still available. Delivery takes three working days.','Which chairs are available?',['Blue','Red','Gray','White'],2,'Ghế xanh đã hết; mẫu màu xám còn hàng.'],
 ['Thank you for calling City Bank. Our branch is open until five on weekdays and until noon on Saturdays.','When does the bank close on Saturday?',['At noon','At five','At six','At nine'],0,'Chi nhánh đóng cửa vào buổi trưa thứ Bảy.'],
 ['Your order arrived with one damaged item. We can replace it free of charge. Please keep the original packaging.','What does the speaker offer?',['A discount on another order','A store membership','A longer warranty','A free replacement'],3,'Người nói đề nghị thay thế miễn phí.'],
 ['The team lunch has been moved to Thursday because our client will visit on Wednesday. We will meet at the cafe downstairs.','On which day is the team lunch?',['Tuesday','Wednesday','Thursday','Friday'],2,'Bữa trưa được chuyển sang thứ Năm.']
];
const reading=[
 ['The manager asked everyone to submit reports _____ Friday.',['by','since','during','at'],0,'“By Friday” chỉ hạn chót: chậm nhất vào thứ Sáu.'],
 ['Ms. Lee is responsible _____ organizing the conference.',['to','for','at','with'],1,'Cụm cố định “be responsible for” nghĩa là chịu trách nhiệm về.'],
 ['The new software works more _____ than the old version.',['efficient','efficiency','efficiently','efficiencies'],2,'Sau động từ “works” cần trạng từ “efficiently”.'],
 ['All visitors must _____ at the reception desk.',['register','registered','registering','registration'],0,'Sau “must” là động từ nguyên mẫu.'],
 ['The shipment was delayed _____ heavy snow.',['although','despite','unless','because of'],3,'“Because of” đi với cụm danh từ “heavy snow” để chỉ nguyên nhân.'],
 ['NOTICE: The library will close at 4 p.m. on Friday for staff training. Normal hours resume on Saturday.\n\nWhy will the library close early?',['Building repairs','Staff training','A public holiday','A book sale'],1,'Thông báo nêu rõ lý do là đào tạo nhân viên.'],
 ['EMAIL: Dear Alex, please bring twenty copies of the proposal to our meeting on Tuesday. We will meet in Room 304 at 10 a.m.\n\nWhat should Alex bring?',['A laptop','A room key','Twenty copies','Ten reports'],2,'Email yêu cầu 20 bản sao của đề xuất.'],
 ['ADVERTISEMENT: Join our fitness center this month and receive your first two personal training sessions free. The offer ends April 30.\n\nWhat is offered for free?',['Two training sessions','A year of membership','Sports clothing','Parking for a year'],0,'Ưu đãi là hai buổi tập cá nhân đầu tiên miễn phí.'],
 ['POLICY: Customers may return unused items within fourteen days of purchase. A receipt is required.\n\nWhat must customers provide?',['A photograph','A membership card','A warranty','A receipt'],3,'Chính sách yêu cầu hóa đơn để trả hàng.'],
 ['MEMO: The marketing team will move to the fifth floor next Monday. Their phone numbers will remain unchanged.\n\nWhat will stay the same?',['The floor','The phone numbers','The office furniture','The meeting schedule'],1,'“Remain unchanged” nghĩa là không thay đổi; ở đây là số điện thoại.']
];
const quote=x=>x==null?'null':"'"+String(x).replaceAll("'","''")+"'";
const insert=(table,fields,rows)=>'insert into '+table+'('+fields+') values\n'+rows.map(row=>'('+row.map(quote).join(',')+')').join(',\n')+'\non conflict ('+fields.split(',')[0]+') do update set '+fields.split(',').slice(1).map(f=>f+'=excluded.'+f).join(',')+';\n';
let sql='-- Original sample content. Re-runnable seed; no official TOEIC material.\nbegin;\n';
sql+=insert('public.topics','id,title,description',groups.map(([id,title,description])=>[id,title,description]));
const audio=[];const words=groups.flatMap(([topic,,,ws])=>ws.map(([word,pronunciation,meaning,example],i)=>{const id=topic+'-'+String(i+1).padStart(2,'0');audio.push({file:id+'.wav',text:word+'. '+example});return [id,topic,word,pronunciation,meaning,example,'/audio/'+id+'.wav'];}));
sql+=insert('public.words','id,topic_id,word,pronunciation,meaning,example,audio_url',words);
sql+=insert('public.exams','id,title,duration_seconds',[['mini-01','Mini test 01',1200]]);
const qgroups=[],questions=[],keys=[];
for(let i=0;i<20;i++){const id='q-'+String(i+1).padStart(2,'0');const gid='group-'+String(i+1).padStart(2,'0');if(i<10){const [script,prompt,options,correct,explanation]=listening[i];audio.push({file:gid+'.wav',text:script});qgroups.push([gid,'mini-01','Listening',null,'/audio/'+gid+'.wav']);questions.push([id,'mini-01',gid,i+1,prompt,JSON.stringify(options)]);keys.push([id,correct,explanation,script]);}else{const [body,options,correct,explanation]=reading[i-10];const parts=body.split('\n\n');qgroups.push([gid,'mini-01','Reading',parts.length>1?parts[0]:null,null]);questions.push([id,'mini-01',gid,i+1,parts.at(-1),JSON.stringify(options)]);keys.push([id,correct,explanation,null]);}}
sql+=insert('public.question_groups','id,exam_id,section,passage,audio_url',qgroups);
sql+=insert('public.questions','id,exam_id,group_id,position,prompt,options',questions);
sql+=insert('private.answer_keys','question_id,correct,explanation,transcript',keys);
sql+='commit;\n';mkdirSync('supabase',{recursive:true});writeFileSync('supabase/seed.sql',sql);mkdirSync('scripts/generated',{recursive:true});writeFileSync('scripts/generated/audio.json',JSON.stringify(audio,null,2));
console.log('Seed: '+words.length+' words, '+questions.length+' questions, '+audio.length+' original audio scripts.');
