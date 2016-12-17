import { Observable } from "data/observable";
import { alert } from "ui/dialogs";

import * as AWS from "nativescript-aws";
import { Credentials } from "nativescript-aws";

declare let JSON, Date: any;



// TODO replace these with your own AWS credentials **************************
const AWS_accessKeyId: string = "YOUR_ACCESS_KEY_ID";
const AWS_secretAccessKey: string = "YOUR_SECRET_ACCESS_KEY";
const AWS_region: string = "us-west-2";
const AWS_S3_bucket: string = "telerikdemoapp";


export class HelloWorldModel extends Observable {
  constructor() {
    super();
    AWS.config.update({
      region: AWS_region,
      credentials: new Credentials(AWS_accessKeyId, AWS_secretAccessKey)
    });
  }

  public listS3BucketContents() {
    const s3 = new AWS.S3({
      apiVersion: "2006-03-01"
    });

    s3.listObjects({Bucket: AWS_S3_bucket}, (err, data) => {
      if (err) {
        alert(JSON.stringify(err));
      } else {
        let result: string = `Loaded ${data.Contents.length} items from S3:\n`;
        for (let i = 0; i < data.Contents.length; i++) {
          result += ` - ${data.Contents[i].Key}\n`;
        }
        alert({
          title: "S3 Bucket contents",
          message: result,
          okButtonText: "OK"
        });
      }
    });
  }

  public listDynamoTables() {
    const db = new AWS.DynamoDB();
    db.listTables((err, data) => {
      if (err) {
        alert(JSON.stringify(err));
      } else {
        alert({
          title: "Dynamo tables",
          message: "" + data.TableNames,
          okButtonText: "OK"
        });
      }
    });
  }

  public updateDynamoTable() {
    new AWS.DynamoDB().putItem({
      TableName: "html5frameworks",
      Item: {
        "Framework ID": {S: "Kendo UI"},
        data: {
          S: "Last update: " + new Date().toString()
        }
      }
    }, (err, data) => {
      if (err) {
        alert(err);
      } else {
        alert({
          title: "",
          message: "Record updated",
          okButtonText: "OK"
        });
      }
    });
  }
}