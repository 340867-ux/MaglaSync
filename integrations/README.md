# MaglaSync CMS/LMS Context Bridges

These companion plugins expose the same small, reviewable context transport on three ecosystems without adding a MaglaSync cloud service.

| Platform | Package | Initial context source | Network calls | Status |
| --- | --- | --- | --- | --- |
| WordPress | `wordpress/maglasync-context` | current post/page title, URL, status, excerpt, content | none | 0.1.0 MVP |
| Drupal | `drupal/maglasync_context` | current node title, URL, bundle, publish state, body | none | 0.1.0 MVP |
| Moodle | `moodle/local/maglasync_context` | course name, summary, visible activities | none | 0.1.0 MVP |

## Shared contract

Every bridge emits `MAGLASYNC_CONTEXT_V1`, leaves the text visible/editable, and requires an explicit user copy action. The plugins do not call AI APIs, create MaglaSync accounts, send analytics, or push content to a MaglaSync backend.

The packages are intentionally useful without the MaglaSync browser extension. The browser extension remains complementary: it can carry project memory between AI chats, while these plugins make source-system context easy to prepare before starting or continuing AI work.

## Directory path

After runtime tests on supported platform versions, each package can be split to its own public repository and submitted to the official WordPress Plugin Directory, Drupal.org contributed projects, and Moodle plugins directory.
