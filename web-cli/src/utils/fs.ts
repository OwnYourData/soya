import findRoot from 'find-root';
import path from 'path';

export const getFileRoot = () => {
  return findRoot(path.resolve());
}