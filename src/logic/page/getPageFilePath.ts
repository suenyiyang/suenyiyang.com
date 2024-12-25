import { existsSync } from "fs";
import path from "path";
import { PAGES_DIR_PATH } from "../constants";

const getMarkdownFileExtension = (filePath: string) => existsSync(`${filePath}.md`) ? `${filePath}.md` : `${filePath}.mdx`;

const removeMarkdownFileExtension = (filePath: string) => filePath.endsWith('.md') || filePath.endsWith('.mdx') ? filePath.replace(/\.md(x)?$/, '') : filePath;

const removeTrailingSlash = (filePath: string) => filePath.endsWith('/') ? filePath.slice(0, -1) : filePath;

const getIndexMarkdownPath = (folderPath: string) => {
  const pathWithoutTrailingSlash = removeTrailingSlash(folderPath);
  return getMarkdownFileExtension(`${pathWithoutTrailingSlash}/index`);
};

const NOT_FOUND_PAGE_PATH = getMarkdownFileExtension(path.join(process.cwd(), './pages/[...404]'));

export const getPageFilePath = (pathname: string[] | undefined) => {
  const folderRelativePath = removeMarkdownFileExtension(`./${pathname?.join('/')}`);
  const folderAbsolutePath = path.join(PAGES_DIR_PATH, folderRelativePath);

  const isFolderAbsolutePathExist = existsSync(folderAbsolutePath);

  if (isFolderAbsolutePathExist) {
    return getIndexMarkdownPath(folderAbsolutePath);
  }

  const fileAbsolutePath = getMarkdownFileExtension(folderAbsolutePath);
  const isFileAbsolutePathExist = existsSync(fileAbsolutePath);

  if (isFileAbsolutePathExist) {
    return fileAbsolutePath;
  }

  return NOT_FOUND_PAGE_PATH;
};
