export interface PagedResult<T> {
    entries: Array<T>;
    pageSize: number;
    entriesCount: number;
    pageNumber: number;
    pagesCount: number;
}
