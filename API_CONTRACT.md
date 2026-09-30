# API Contract

All clients use the same Google Apps Script endpoint.

Request:

```json
{
  "action": "login",
  "payload": {
    "username": "admin",
    "password": "..."
  },
  "session": ""
}
```

Response:

```json
{
  "success": true,
  "message": "",
  "data": {}
}
```

Current actions in the starter backend:

- `login`
- `student.getPage`
- `student.prayer`
- `admin.dashboard`
- `usthad.dashboard`

Recommended expansion follows the same naming scheme:

- `students.list`
- `students.create`
- `students.update`
- `students.delete`
- `students.qr`
- `teachers.list`
- `teachers.create`
- `teachers.update`
- `classes.list`
- `classes.create`
- `teacherClasses.assign`
- `attendance.list`
- `attendance.save`
- `ce.list`
- `ce.save`
- `activities.list`
- `activities.save`
- `exams.list`
- `exams.create`
- `marks.save`
- `results.publish`
- `notices.list`
- `notices.create`
- `programs.list`
- `programs.create`
- `programs.update`
- `programs.delete`
- `reports.dashboard`

Every write endpoint must enforce authorization on the server.
