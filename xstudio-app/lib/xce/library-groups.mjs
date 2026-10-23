export const libraryFolders=['Correct Character Sheets','needs to be generated correctly','Scenes','Props and Locations','Reference Notes and Corrections','Marketing Graphics'];
export function libraryFolder(reference){
 const name=reference.name||'';
 return libraryFolders.find(folder=>name.endsWith(' ['+folder+']'))||null;
}
export function groupedLibraryReferences(references){
 return libraryFolders.map(folder=>({folder,records:references.filter(r=>libraryFolder(r)===folder).map(r=>({...r,category:'references',asset_id:r.id}))})).filter(group=>group.records.length);
}
