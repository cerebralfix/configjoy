#! /usr/bin/env node
'use strict';

const { program } = require('commander');
const { exec, spawn } = require('child_process');
const wellKnown = require('./well_known.json');
const path = require('path');
const fs = require('fs');
const fsExtra = require('fs-extra');
const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const { convert, Options } = require("./convert");

program
    .name('string-util')
    .version('0.1.3')
    .description('A structured, type-safe editor for configurable data.')
    .option('--files <files>')
    .option('--schema <schema>')
    .option('--unity-output-dir <unityOutputDir>', 'Directory to output generated Unity C# files')
    .option('--generate-only', 'Generate files and terminate without running the interface.', false)
    .option('--port', 'The port to listen on for the interface.', 9876)

program.parse();

async function run() {
    if ((program.opts().files && program.args.length > 0) || (!program.opts().files && program.args.length === 0)) {
        console.error('Error: please specify either --files or a file argument \n\te.g. "configjoy ./config-file.json" or "configjoy --files ./config-file.json"');
        process.exit(1)
    }

    let filesDir = program.opts().files || program.args[0]
    let schemaDir = program.opts().schema

    if (!fs.existsSync(filesDir)) {
        console.error(`Error: ${filesDir} doesn't exist.`)
        process.exit(1);
    }

    if (!schemaDir) {
        if (wellKnown[filesDir]) {
            schemaDir = path.join(__dirname, 'schema', 'well_known', wellKnown[filesDir])
        } else {
            await new Promise((resolve, reject) => {
                rl.question(`Schema for ${filesDir} is not built in and no --schema was provided.\nAuto generate a schema file for ${filesDir}?\n(y/n): `, function (generate) {
                    if (generate === 'y') {
                        rl.question(`Enter a directory to save ${filesDir}.proto:\n`, function (dir) {
                            const resolved = path.resolve(dir);
                            fsExtra.mkdirpSync(resolved);
                            schemaDir = path.join(resolved, path.basename(filesDir)) + '.proto';
                            const rootMessageName = path.basename(filesDir).slice(0, path.basename(filesDir).lastIndexOf('.')).replace('.', '');
                            console.log(`Generating schema file at ${schemaDir}...`);
                            try {
                                fs.writeFileSync(schemaDir, convert(fs.readFileSync(filesDir, 'utf-8'), new Options(rootMessageName, true, true, true)).success, { flag: 'wx' });
                                console.log(`Success! For subsequent runs use:\n\tconfigjoy --files ${filesDir} --schema ${path.join(dir, path.basename(filesDir) + '.proto')}`)
                            } catch (e) {
                                if (e.code === 'EEXIST') {
                                    console.log("Error: a schema file at that location already exists, please remove it before generating a new schema.")
                                    console.log(`Alternatively, you can use the existing schema with:\n\tconfigjoy --files ${filesDir} --schema ${path.join(dir, path.basename(filesDir) + '.proto')}`)
                                } else {
                                    console.log(e);
                                }
                                process.exit(1);
                            }
                            resolve();
                        });
                    } else {
                        rl.close();
                        process.exit();
                    }
                });
            })
        }
    }

    let protoPath = '';
    let schemaFiles = '';
    if (fs.lstatSync(schemaDir).isDirectory() == false) {
        protoPath = path.resolve(schemaDir, '..');
        schemaFiles = path.resolve(schemaDir, '.');
    } else {
        protoPath = schemaDir;
        schemaFiles = path.join(schemaDir, '*.proto');
    }

    if (fs.lstatSync(filesDir).isDirectory() == false) {
        filesDir = path.resolve(filesDir, '..')
    }

    await new Promise((resolve, reject) => {
        exec(`${path.join(__dirname, '/protogen/bin/protoc')} \
        --plugin=protoc-gen-ts=${path.join(__dirname, '/node_modules/.bin/protoc-gen-ts')} \
        --ts_out=${path.join(__dirname, '/generated/typescript/src')} \
        --plugin=protoc-gen-configjoy=${path.join(__dirname, '/protogen/scripts/protoc-gen-configjoy')} \
        --configjoy_out=${path.join(__dirname, '/generated/')} \
        --configjoy_opt=dataDirectory=${filesDir},port=${program.opts().port}${program.opts().unityOutputDir ? `,unityOutputDir=${program.opts().unityOutputDir}` : ''} \
        ${program.opts().unityOutputDir ? `--csharp_out=${program.opts().unityOutputDir}` : ''} \
        --proto_path=${protoPath} \
        ${schemaFiles}`,
            (error, stdout, stderr) => {
                if (error) {
                    console.log(error, stderr);
                    reject();
                } else {
                    resolve();
                }
            });
    })

    if (!program.opts().generateOnly) {
        let printedWelcomeMessage = false;
        const yarn = spawn('yarn', ['dev', '-p', program.opts().port], { cwd: __dirname });

        yarn.stdout.on('data', (data) => {
            if (!printedWelcomeMessage) {
                printedWelcomeMessage = true;
                console.log(`Interface running at http://localhost:${program.opts().port}`)
            }
        });

        yarn.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
        });

        yarn.on('close', (code) => {
            console.log(`child process exited with code ${code}`);
        });
    } else {
        process.exit(0);
    }
}

run();