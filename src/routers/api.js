import express from "express";
import { mongoHelper } from "../helpers/mongoHelper.js";
import {
  ScoreByTablePipelineHelper,
  ScoreByVpsIdPipelineHelper,
  SearchPipelineHelper,
  AllPipelineHelper,
} from "../helpers/pipelineHelper.js";

const router = express.Router();

router.get("/", function (req, res) {
  res.send("VPC Data Service is up and running...");
});

router.get("/tables", async (req, res) => {
  const tables = await mongoHelper.getAll("tables");
  res.send(tables);
});

router.get("/tablesWithAuthorVersion", async (req, res) => {
  let pipeline = new AllPipelineHelper().pipelineTablesWithAuthorVersion;
  const tables = await mongoHelper.aggregate(pipeline, "tables");
  res.send(tables);
});

router.get("/scoresByTable", async (req, res) => {
  let tableName = req.query.tableName;
  let pipeline = new ScoreByTablePipelineHelper(tableName, null, null)
    .pipelineScoresByTable;
  const table = await mongoHelper.aggregate(pipeline, "tables");
  res.send(table);
});

router.get("/scoresByTable", async (req, res) => {
  let tableName = req.query.tableName;
  let pipeline = new ScorePipelineHelper(tableName, null, null)
    .pipelineScoresByTable;
  const table = await mongoHelper.aggregate(pipeline, "tables");
  res.send(table);
});

router.get("/scoresByTableAndAuthor", async (req, res) => {
  let tableName = req.query.tableName;
  let authorName = req.query.authorName;
  let pipeline = new ScorePipelineHelper(tableName, authorName, null)
    .pipelineScoresByTableAndAuthor;
  const table = await mongoHelper.aggregate(pipeline, "tables");
  res.send(table);
});

router.get("/scoresByVpsId", async (req, res) => {
  let vpsId = req.query.vpsId;
  let pipeline = new ScoreByVpsIdPipelineHelper(vpsId).pipelineScoresByVpsId;
  const table = await mongoHelper.aggregate(pipeline, "tables");
  res.send(table);
});

router.get("/scoresByTableAndAuthorUsingFuzzyTableSearch", async (req, res) => {
  let tableSearchTerm = req.query.tableSearchTerm;
  let pipeline = new SearchPipelineHelper(tableSearchTerm)
    .pipelineScoresByTableAndAuthorUsingFuzzyTableSearch;
  const table = await mongoHelper.aggregate(pipeline, "tables");
  res.send(table);
});

router.get("/scoresByTableAndAuthorAndVersion", async (req, res) => {
  let tableName = req.query.tableName;
  let authorName = req.query.authorName;
  let versionNumber = req.query.versionNumber;
  let pipeline = new ScoreByTablePipelineHelper(
    tableName,
    authorName,
    versionNumber
  ).pipelineScoresByTableAndAuthorAndVersion;
  const table = await mongoHelper.aggregate(pipeline, "tables");
  res.send(table);
});

router.get("/weeks", async (req, res) => {
  const weeks = await mongoHelper.getAll("weeks");
  res.send(weeks);
});

router.get("/weeksByChannelName", async (req, res) => {
  const pipeline = [
    {
      $group: {
        _id: {
          channelName: "$channelName",
        },
        weeks: {
          $addToSet: "$$ROOT",
        },
      },
    },
    {
      $project: {
        _id: 0,
        channelName: "$_id.channelName",
        weeks: "$weeks",
      },
    },
    { $sort: { channelName: 1 } },
  ];
  const weeks = await mongoHelper.aggregate(pipeline, "weeks");

  res.send(weeks);
});

router.get("/currentWeek", async (req, res) => {
  let channelName = req.query.channelName ?? "competition-corner";
  const week = await mongoHelper.findCurrentWeek("weeks", channelName);
  res.send(week);
});

export default router;
