import {listGrades,writeGrade} from '../../../lib/xce/cge-api';
export const dynamic='force-dynamic';
export const GET=listGrades;
export async function POST(req:Request){return writeGrade(req)}
