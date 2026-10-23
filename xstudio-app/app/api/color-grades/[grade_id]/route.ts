import {writeGrade} from '../../../../lib/xce/cge-api';
export const dynamic='force-dynamic';
export async function PATCH(req:Request,context:{params:Promise<{grade_id:string}>}){const {grade_id}=await context.params;return writeGrade(req,grade_id)}
