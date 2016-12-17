console.log("**********************************************************");
console.log("******* start nativescript-aws compatibility patch *******");
console.log("**********************************************************");

var fs = require('fs'),
    path = require('path'),
    replaceInFile = require('replace-in-file');

// extracted this var as I can foresee part of this hook turning into a standalone plugin
var rootpackagename = 'aws-sdk';

function changeFiles(files, replace, by) {
  var changedFiles = replaceInFile.sync({
    files: files,
    replace: replace,
    with: by,
    allowEmptyPaths: true
  });
  if (changedFiles.length > 0) {
    console.log("\nReplaced '" + replace + "' by '" + by + "' in:\n " + changedFiles.join('\n '));
  }
}

function findFilesByName(startPath, filter, result) {
  if (fs.existsSync(startPath)) {
    var files = fs.readdirSync(startPath);
    for (var i = 0; i < files.length; i++) {
      var filename = files[i];
      var filepath = path.join(startPath, filename);
      var stat = fs.lstatSync(filepath);
      if (stat.isDirectory()) {
        findFilesByName(filepath, filter, result);
      } else if (filename === filter) {
        result.push("./" + startPath);
      }
    }
  }
  return result;
}

function patchPackageJsonMainAndFetchBrowserNode(fileName) {
  var file = require(fileName);
  var main = file.main;
  var browser = file.browser;
  if (main && browser) {
    var mainReplacement = browser[main];
    if (mainReplacement) {
      console.log("\n" + fileName + "'s main ('" + main + "') was replaced by its browser version ('" + mainReplacement + "')");
      file.main = mainReplacement;
      fs.writeFileSync(fileName, JSON.stringify(file, null, 2));
    }
  }
  return browser;
}

function patchPackage(packagepath) {
  var browserNode = patchPackageJsonMainAndFetchBrowserNode(packagepath + "/package.json");
  if (browserNode) {
    var transformed = [];
    var nodeValue;
    // duplicate all modules starting with './' to '../' as modules may be referenced in either way
    for (nodeValue in browserNode) {
      if (browserNode.hasOwnProperty(nodeValue) && browserNode[nodeValue]) {
        if (nodeValue.startsWith("./")) {
          transformed.push(["\\.\\" + nodeValue, "." + browserNode[nodeValue]]);
        }
        transformed.push([nodeValue, browserNode[nodeValue]]);
      }
    }
    for (var i in transformed) {
      nodeValue = transformed[i][0];
      var browserReplacement = transformed[i][1];
      if (browserReplacement) {
        if (nodeValue.endsWith(".js")) {
          nodeValue = nodeValue.substring(0, nodeValue.indexOf(".js"));
        }
        if (browserReplacement.endsWith(".js")) {
          browserReplacement = browserReplacement.substring(0, browserReplacement.indexOf(".js"));
        }
        var where = [packagepath + "/**/*.js"],
            what = new RegExp("require\\((.*)" + nodeValue + "(.*)\\)", "g"),
            // to be safe, adding a space after require so it won't match repeatedly
            by = "require ('" + browserReplacement + "')";
        changeFiles(where, what, by);
      }
    }
  }
}


try {
  var rootpackagepath = "./node_modules/" + rootpackagename;
  var packages = findFilesByName(rootpackagepath + "/node_modules", "package.json", [rootpackagepath]);
  // console.log("\npackage.jsons found in:\n " + packages.join("\n "));

  for (var p in packages) {
    patchPackage(packages[p]);
  }

  // we need to do some more replacements than specified in the root package.json as these modules depend on a browser window / DOM
  changeFiles(["./node_modules/" + rootpackagename + "/lib/browser_loader.js"], "require('./xml/browser_parser')", "require('./xml/node_parser')");
  changeFiles(["./node_modules/" + rootpackagename + "/lib/xml/node_parser.js"], "require('xml2js')", "require('nativescript-xml2js')");

} catch (error) {
  console.error('Error occurred:', error);
}

console.log("\n");
console.log("**********************************************************");
console.log("*******  end nativescript-aws compatibility patch  *******");
console.log("**********************************************************");
console.log("\n");