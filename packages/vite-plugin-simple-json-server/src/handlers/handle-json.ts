import path from 'node:path';
import fs from 'node:fs';
import querystring from 'node:querystring';
import type { ServerResponse } from 'node:http';
import { Connect } from 'vite';

import { fileTypes } from '../constants';

import { isDirExists, isFileExists } from '../utils/files';
import { ILogger } from '../utils/logger';

import { validateReq } from '../helpers/validate-request';
import { sendFileContent } from '../helpers/send-file-content';

import { filter } from './helpers/filter';
import { getFilteredCount } from './helpers/get-filtered-count';

const COUNT_SUFFIX = '/count';
const EXT = 'json';

export function handleJson(
  req: Connect.IncomingMessage,
  res: ServerResponse,
  viteRoot: string,
  mockRootDir: string,
  urlPath: string,
  logger: ILogger,
) {
  let count = false;

  if (urlPath.endsWith(COUNT_SUFFIX)) {
    urlPath = urlPath.substring(0, urlPath.length - COUNT_SUFFIX.length);
    count = true;
  }

  const pathname = path.join(viteRoot, mockRootDir, urlPath);

  const name = isDirExists(pathname) ? 'index' : '';

  const filePath = (name ? path.join(pathname, name) : pathname) + '.' + EXT;

  if (!isFileExists(filePath)) {
    return false;
  }
  if (!validateReq(req, res, 405, ['GET', 'POST'])) {
    return true;
  }

  const [, qs] = req.url!.split('?');
  if (!count && !qs) {
    sendFileContent(res, filePath, fileTypes.json, logger);
    return true;
  }

  const q = querystring.parse(qs);

  let page = 0;
  let limit = 0;
  let sort = '';
  let order = 'asc';

  if (q['page']) {
    page = Math.max(1, parseInt(q['page'] as string));
  }
  if (q['limit']) {
    limit = Math.max(0, parseInt(q['limit'] as string));
    if (limit === 0) {
      limit = 10;
    }
  }
  if (q['sort']) {
    sort = q['sort'] as string;
  }

  if (q['order']) {
    order = q['order'] as string;
    if (order !== 'asc' && order !== 'desc') {
      order = 'asc';
    }
  }

  res.setHeader('Content-Type', fileTypes.json);
  const content = fs.readFileSync(filePath, 'utf-8');

  if (!page && !limit && !sort && !count) {
    logger.info('matched', `file: ${filePath}`);
    res.end(content);
    return true;
  }

  let data = JSON.parse(content);
  if (!Array.isArray(data) || data.length === 0) {
    logger.info('matched', `file: ${filePath}`);
    res.end(content);
    return true;
  }

  if (count) {
    logger.info('matched', `query: ${qs}`, `file: ${filePath}`);
    res.end(JSON.stringify({ count: getFilteredCount(data, q) }));
    return true;
  }

  data = filter(data, q);
  if (page || limit) {
    page = page ? page : 1;
    limit = limit ? limit : 10;
    const start = (page - 1) * limit;
    const end = start + limit;
    data = data.slice(start, end);
  }
  if (sort && data.length && data[0].hasOwnProperty(sort)) {
    const dir = order === 'asc' ? 1 : -1;
    data = data.sort((a: any, b: any) => {
      if (a[sort] > b[sort]) {
        return 1 * dir;
      }
      if (a[sort] < b[sort]) {
        return -1 * dir;
      }
      return 0;
    });
  }
  logger.info('matched', `query: ${qs}`, `file: ${filePath}`);
  res.end(JSON.stringify(data));

  return true;
}
