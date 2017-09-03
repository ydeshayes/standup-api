export function addDays(date, days) {
    var result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

export function removeDays(date, days) {
    var result = new Date(date);
    result.setDate(result.getDate() - days);
    return result;
}
