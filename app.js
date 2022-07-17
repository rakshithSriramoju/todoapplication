const express = require("express");
const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
app.use(express.json());
const path = require("path");
const dbPath = path.join(__dirname, "todoApplication.db");
let database = null;
let format = require("date-fns/format");

const instilizingServerAndDatabase = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => console.log("Server Is Activated"));
  } catch (error) {
    console.log(`dbError : ${error.message}`);
    process.exit(1);
  }
};
instilizingServerAndDatabase();

const hasOnlyStatus = (query) => {
  return (
    query.status !== undefined &&
    query.priority === undefined &&
    query.category === undefined
  );
};
const hasOnlyPriority = (query) => {
  return (
    query.status === undefined &&
    query.priority !== undefined &&
    query.category === undefined
  );
};
const hasStatusAndPriority = (query) => {
  return (
    query.status !== undefined &&
    query.priority !== undefined &&
    query.category === undefined
  );
};
const hasStatusAndCategory = (query) => {
  return (
    query.status !== undefined &&
    query.priority === undefined &&
    query.category !== undefined
  );
};
const hasOnlyCategory = (query) => {
  return (
    query.status === undefined &&
    query.priority === undefined &&
    query.category !== undefined
  );
};
const hasCategoryAndPriority = (query) => {
  return (
    query.status === undefined &&
    query.priority !== undefined &&
    query.category !== undefined
  );
};

const convertingDbobjectToResponseObject = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
    category: dbObject.category,
    dueDate: dbObject.due_date,
  };
};

const verifyStatus = (status) => {
  return status === "TO DO" || status === "IN PROGRESS" || status === "DONE";
};
const verifyPriority = (priority) => {
  return priority === "HIGH" || priority === "MEDIUM" || priority === "LOW";
};
const verifyCategory = (category) => {
  return category === "WORK" || category === "HOME" || category === "LEARNING";
};

app.get("/todos/", async (request, response) => {
  const { status, priority, category, search_q = "" } = request.query;

  switch (true) {
    case hasOnlyStatus(request.query):
      if (verifyStatus(status)) {
        const statusQuery = `
                SELECT * FROM todo WHERE status='${status}'
                `;
        const getStatus = await database.get(statusQuery);
        response.send(convertingDbobjectToResponseObject(getStatus));
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case hasOnlyPriority(request.query):
      if (verifyStatus(priority)) {
        const priorityQuery = `
                SELECT * FROM todo WHERE priority='${priority}'
                `;
        const getPriority = await database.get(priorityQuery);
        response.send(convertingDbobjectToResponseObject(getPriority));
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case hasOnlyCategory(request.query):
      if (verifyStatus(category)) {
        const categoryQuery = `
                SELECT * FROM todo WHERE category='${category}'
                `;
        const getCategory = await database.get(categoryQuery);
        response.send(convertingDbobjectToResponseObject(getCategory));
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case hasStatusAndPriority(request.query):
      if (verifyStatus(status) && verifyPriority(priority)) {
        const statusAndPriorityQuery = `
                SELECT * FROM todo WHERE status='${status}' AND priority ='${priority}'
                `;
        const getStatusAndPriority = await database.get(statusAndPriorityQuery);
        response.send(convertingDbobjectToResponseObject(getStatusAndPriority));
      } else {
        if (verifyStatus(status) === false) {
          response.status(400);
          response.send("Invalid Todo Status");
        } else {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
      }
      break;
    case hasCategoryAndPriority(request.query):
      if (verifyCategory(category) && verifyPriority(priority)) {
        const categoryAndPriorityQuery = `
                SELECT * FROM todo WHERE category ='${category}' AND priority = '${priority}'
                `;
        const getCategoryAndPriorityQuery = await database.get(
          categoryAndPriorityQuery
        );
        response.send(
          convertingDbobjectToResponseObject(getCategoryAndPriorityQuery)
        );
      } else {
        if (verifyCategory(category) === false) {
          response.status(400);
          response.send("Invalid Todo Category");
        } else {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
      }
      break;
    case hasStatusAndCategory(request.query):
      if (verifyCategory(category) && verifyStatus(status)) {
        const categoryAndStatusQuery = `
                SELECT * FROM todo WHERE category ='${category}' AND status = '${status}'
                `;
        const getCategoryAndStatusQuery = await database.get(
          categoryAndStatusQuery
        );
        response.send(
          convertingDbobjectToResponseObject(getCategoryAndStatusQuery)
        );
      } else {
        if (verifyCategory(category) === false) {
          response.status(400);
          response.send("Invalid Todo Category");
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      }
      break;
    default:
      const query = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%'`;
      const getQuery = await database.all(query);
      response.send(getQuery);
      break;
  }
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const Todo = `
    SELECT * FROM todo WHERE id= ${todoId}
    `;
  const gettodo = await database.get(Todo);
  response.send(convertingDbobjectToResponseObject(gettodo));
});

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;

  let newDate = format(new Date(date), "yyyy-MM-dd");
  const getTodoOnDate = `
  SELECT * FROM todo WHERE due_date='${newDate}' 
  `;
  const getResult = await database.all(getTodoOnDate);
  response.send(getResult);
});

app.post("/todos/", async (request, response) => {
  const { id, status, priority, category, todo, dueDate } = request.body;
  const createTodo = `
    INSERT INTO todo (id,todo,priority,status,category,due_date)
    VALUES
    (${id},'${todo}','${priority}','${status}','${category}','${dueDate}')
    `;
  const insertValue = await database.run(createTodo);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let a = request.body;
  let updated = "";
  switch (true) {
    case a.todo !== undefined:
      updated = "Todo";
      break;
    case a.priority !== undefined:
      updated = "Priority";
      break;
    case a.category !== undefined:
      updated = "Category";
      break;
    case a.dueDate !== undefined:
      updated = "Due Date";
      break;
    default:
      updated = "Status";
      break;
  }

  let previewsQuery = `
    SELECT
    *
    FROM todo
    WHERE id=${todoId}
    `;
  let getPreviews = await database.get(previewsQuery);
  let {
    todo = getPreviews.todo,
    priority = getPreviews.priority,
    status = getPreviews.status,
    dueDate = getPreviews.due_date,
    category = getPreviews.category,
  } = request.body;

  const b = `
    UPDATE todo 
    SET 
    todo='${todo}',
    priority='${priority}',
    status='${status}',
    category='${category}',
    due_date='${dueDate}'

    WHERE id=${todoId}
    `;
  const result = await database.run(b);
  response.send(`${updated} Updated`);
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
  DELETE FROM
    todo
  WHERE
    id = ${todoId};`;

  await database.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
