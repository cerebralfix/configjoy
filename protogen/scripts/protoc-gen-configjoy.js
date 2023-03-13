#! /usr/bin/env node
const fs = require('fs');
const fsExtra = require('fs-extra');
const path = require('path');

const { CodeGeneratorRequest, CodeGeneratorResponse, CodeGeneratorResponseError } = require('protoc-plugin')

CodeGeneratorRequest()
    .then(r => {
        // convert to object
        // alternately, you can do all the google-protobuf stuff here
        const req = r.toObject()
        const options = req.parameter.split(',').map(o => o.split('='));
        const dataDir = (options.find(o => o[0] === 'dataDirectory')[1]).replaceAll("\\", "/");
        let unityOutputDir = (options.find(o => o[0] === 'unityOutputDir') || [])[1]
        const port = options.find(o => o[0] === 'port')[1]
        // just get proto files that are being parsed directly by protoc
        const protos = req.protoFileList.filter(p => req.fileToGenerateList.indexOf(p.name) !== -1)
        // return array of file objects: [{name, contents, insertion_point}]
        const rootProtoNames = [];
        const baseName = path.join(__dirname, '../..');

        fsExtra.mkdirpSync(dataDir)
        unityOutputDir && fsExtra.mkdirpSync(unityOutputDir);
        fsExtra.emptyDirSync(path.join(baseName, '/generated/typescript/src'));
        fsExtra.emptyDirSync(path.join(baseName, '/pages/generated'));
        fsExtra.emptyDirSync(path.join(baseName, '/pages/api'));
        fsExtra.emptyDirSync(path.join(baseName, '/generated/unity/src'));
        fsExtra.emptyDirSync(path.join(baseName, '/generated/react'));

        for (const proto of protos) {
            const rootProtoName = path.basename(proto.name).slice(0, proto.name.lastIndexOf('.'));
            const rootProtoNameWithExtension = rootProtoName.includes('.') ? rootProtoName : rootProtoName + '.json';
            rootProtoNames.push(rootProtoName);
            // fs.writeFileSync('generated/' + 'out.json', JSON.stringify(protos, null, 2));
            try {
                fs.writeFileSync(`${dataDir}/${rootProtoNameWithExtension}`, '{}', { flag: 'wx' });
            } catch { }

            let pageTemplate = fs.readFileSync(path.join(baseName + '/templates/page.tsx'), 'utf-8');
            pageTemplate = pageTemplate.replaceAll("__ROOT_MESSAGE_NAME__", rootProtoName);
            pageTemplate = pageTemplate.replaceAll("__ROOT_MESSAGE_NAME_WITH_EXTENSION__", rootProtoNameWithExtension);
            pageTemplate = pageTemplate.replaceAll("__MESSAGE_NAME__", proto.messageTypeList[0].name);
            pageTemplate = pageTemplate.replaceAll("__PORT__", port);
            fs.writeFileSync(baseName + `/pages/generated/${rootProtoName.startsWith('.') ? rootProtoName.slice(1) : rootProtoName}.tsx`, pageTemplate);

            if (unityOutputDir) {
                let unityTemplate = fs.readFileSync(path.join(baseName + '/templates/Base.cstemplate'), 'utf-8');
                unityTemplate = unityTemplate.replaceAll("__ROOT_MESSAGE_NAME__", rootProtoName);
                unityTemplate = unityTemplate.replaceAll("__MESSAGE_NAME__", proto.messageTypeList[0].name);
                unityTemplate = unityTemplate.replaceAll("__CSHARP_DATA_PATH__", dataDir);
                unityTemplate = unityTemplate.replaceAll("__UNITY_RESOURCES_PATH__", `${dataDir.split('Resources/')[1]}/${rootProtoName}`);
                unityTemplate = unityTemplate.replaceAll("__VAR_NAME__", proto.messageTypeList[0].name[0].toLowerCase() + proto.messageTypeList[0].name.slice(1));
                fs.writeFileSync(baseName + `/generated/unity/src/${proto.messageTypeList[0].name}Loader.cs`, unityTemplate);
                fsExtra.copySync(`${baseName}/generated/unity/`, unityOutputDir);
            }

            let readTemplate = fs.readFileSync(path.join(baseName + '/templates/read.ts'), 'utf-8');
            readTemplate = readTemplate.replaceAll("__DATA_DIRECTORY__", dataDir);
            fs.writeFileSync(baseName + `/pages/api/read.ts`, readTemplate);

            let writeTemplate = fs.readFileSync(path.join(baseName + '/templates/write.ts'), 'utf-8');
            writeTemplate = writeTemplate.replaceAll("__DATA_DIRECTORY__", dataDir);
            fs.writeFileSync(baseName + `/pages/api/write.ts`, writeTemplate);
        }

        let outerDataTemplate = fs.readFileSync(path.join(baseName + '/templates/data-outer.ts'), 'utf-8');
        outerDataTemplate = outerDataTemplate.replaceAll("__NAMES__", rootProtoNames.map(p => `\t"${p.startsWith('.') ? p.slice(1) : p}"`).join(',\n'));
        fs.writeFileSync(baseName + `/generated/react/outer-data.ts`, outerDataTemplate);

        let middleWareTemplate = fs.readFileSync(path.join(baseName + '/templates/middleware.js'), 'utf-8');
        middleWareTemplate = middleWareTemplate.replaceAll("__PORT__", port);
        fs.writeFileSync(baseName + `/middleware.js`, middleWareTemplate);

        return [];
    })
    .then(CodeGeneratorResponse())
    .catch(CodeGeneratorResponseError());
