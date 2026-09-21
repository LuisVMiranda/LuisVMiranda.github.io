import './check-reviews';
import { readContent } from './content-files';
import { contentRevision, isApproved } from '../src/modules/editions/integrity';

const { articles, editions, approval } = await readContent();
const requestedRevision =
  process.env.APPROVED_REVISION || approval?.revision || '';
if (
  !isApproved(articles, editions, approval) ||
  !articles.length ||
  !editions.length
)
  throw new Error('Release requires reviewed content');
if (requestedRevision !== contentRevision(articles, editions))
  throw new Error('Deployment revision differs from explicit approval');
const site = new URL(process.env.SITE_URL || 'https://luisvmiranda.github.io');
if (site.protocol !== 'https:' || site.pathname !== '/')
  throw new Error(
    'SITE_URL must be an HTTPS origin; /news/ is configured separately',
  );
console.log('Editorial revision and all implementation reviews are valid.');
