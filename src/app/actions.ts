'use server';
import {supabase} from '@/lib/supabase/server';
import {revalidatePath} from 'next/cache';
type RpcName='start_attempt'|'save_answer'|'submit_attempt'|'start_study'|'rate_word'|'complete_study';
export async function command(name:RpcName,args:Record<string,string|number|Record<string,string>>):Promise<{data:unknown;error:string|null}>{
 if(!['start_attempt','save_answer','submit_attempt','start_study','rate_word','complete_study'].includes(name))return {data:null,error:'Yêu cầu không hợp lệ.'};
 try{const db=await supabase();const {data:{user}}=await db.auth.getUser();if(!user)return {data:null,error:'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'};
 const {data,error}=await db.rpc(name,args);
 if(error)return {data:null,error:'Không thể lưu dữ liệu. Kiểm tra kết nối hoặc tải lại trang.'};
 // Refresh summaries without rebuilding the active flashcard page on every rating.
 if(['start_study','rate_word','complete_study'].includes(name)){
  revalidatePath('/dashboard');revalidatePath('/vocabulary');
 }
 if(['start_attempt','submit_attempt'].includes(name)){
  revalidatePath('/dashboard');revalidatePath('/exams');revalidatePath('/history');
 }
 return {data,error:null};
 }catch{return {data:null,error:'Mất kết nối. Vui lòng thử lại.'};}
}
