export default function PublicDirectoryControls({
  sort = 'az',
  category = 'all',
  categories = [],
  label = 'Sort and filter directory',
  allLabel = 'All categories',
}) {
  return (
    <form className="public-directory-controls" method="get" aria-label={label}>
      <label>
        Sort
        <select name="sort" defaultValue={sort}>
          <option value="az">A-Z</option>
          <option value="za">Z-A</option>
          <option value="category">Category</option>
        </select>
      </label>
      <label>
        Category
        <select name="category" defaultValue={category}>
          <option value="all">{allLabel}</option>
          {categories.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </label>
      <button className="button" type="submit">Apply</button>
    </form>
  );
}
