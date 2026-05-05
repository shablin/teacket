# Permissions & Roles

Available roles: `employee`, `executor`, `manager`, `admin`

## What they can do
| Action | `employee` | `executor` | `manager` | `admin` |
| --- | :-: | :-: | :-: | :-: |
| `view` | only its own tickets | its own and its department | all | all |
| `create` | yes (if it's active) | yes (if it's active) | yes (if it's active) | yes (if it's active) |
| `update` | only its own tickets | no | all | all |
| `assign` | no | yes | yes | yes |
| `changeStatus` | no | only assigned to itself | all | all |
| `reopen` | only its own tickets | no | all | all |
| `comment` | only tickets with `view` access | with `view` | with `view` | with `view` |
| `attach` | only tickets with `view` access | with `view` | with `view` | with `view` |

## Also...
- If `is_active` is `false`, all the actions are blocked
- Admin routes `/admin/*` are only available for `admin` with `is_active` is `true`