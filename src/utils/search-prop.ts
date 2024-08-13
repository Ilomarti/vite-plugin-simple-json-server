export const searchProp = (item: any, q: Record<string, any>, props: string[]) => {
  for (const prop of props) {
    if (!item.hasOwnProperty(prop)) {
      return false;
    }
    const propValue = item[prop];
    if (propValue === undefined) {
      return false;
    }
    if (Array.isArray(q[prop])) {
      if (!q[prop].some((val: any) => val == propValue)) {
        return false;
      }
    } else if (q[prop] != propValue) {
      return false;
    }
  }
  return true;
};
