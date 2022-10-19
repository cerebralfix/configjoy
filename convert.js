/*
Forked from https://github.com/json-to-proto/json-to-proto.github.io/blob/8210c9149d7b0f9b8185c8b92ea97f6d752da056/src/convert.ts
and modified / redistributed under MIT license:

MIT License

Copyright (c) 2020 json-to-proto

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

const googleAnyImport = "google/protobuf/any.proto";
const googleTimestampImport = "google/protobuf/timestamp.proto";
const googleAny = "google.protobuf.Any";
const googleTimestamp = "google.protobuf.Timestamp";
class Result {
    constructor(success, error) {
        this.success = success;
        this.error = error;
    }
}
class ProtoPrimitiveType {
    constructor(name, complex, merge) {
        this.name = name;
        this.complex = complex;
        this.merge = merge;
    }
}
const boolProtoPrimitiveType = new ProtoPrimitiveType("bool", false, false);
const stringProtoPrimitiveType = new ProtoPrimitiveType("string", false, false);
const int64ProtoPrimitiveType = new ProtoPrimitiveType("int64", false, true);
const complexProtoType = new ProtoPrimitiveType(googleAny, true, false);
const timestampProtoType = new ProtoPrimitiveType(googleTimestamp, false, false);
class Options {
    constructor(outerMessageTitle, inline, googleProtobufTimestamp, mergeSimilarObjects) {
        this.outerMessageTitle = outerMessageTitle;
        this.inline = inline;
        this.googleProtobufTimestamp = googleProtobufTimestamp;
        this.mergeSimilarObjects = mergeSimilarObjects;
    }
}
class Collector {
    constructor() {
        this.imports = new Set();
        this.messages = [];
        this.messageNameSuffixCounter = {};
    }
    addImport(importPath) {
        this.imports.add(importPath);
    }
    generateUniqueName(source) {
        if (this.messageNameSuffixCounter.hasOwnProperty(source)) {
            const suffix = this.messageNameSuffixCounter[source];
            this.messageNameSuffixCounter[source] = suffix + 1;
            return `${source}${suffix}`;
        }
        this.messageNameSuffixCounter[source] = 1;
        return source;
    }
    addMessage(lines) {
        this.messages.push(lines);
    }
    getImports() {
        return this.imports;
    }
    getMessages() {
        return this.messages;
    }
}
class Analyzer {
    constructor(options) {
        this.options = options;
        this.mergeSimilarObjectMap = {};
    }
    analyze(json) {
        if (this.directType(json)) {
            return this.analyzeObject({ "first": json });
        }
        if (Array.isArray(json)) {
            return this.analyzeArray(json);
        }
        return this.analyzeObject(json);
    }
    directType(value) {
        switch (typeof value) {
            case "string":
            case "number":
            case "boolean":
                return true;
            case "object":
                return value === null;
        }
        return false;
    }
    analyzeArray(array) {
        const inlineShift = this.addShift();
        const collector = new Collector();
        const lines = [];
        const typeName = this.analyzeArrayProperty("nested", array, collector, inlineShift);
        lines.push(`    ${typeName} items = 1;`);
        return render(collector.getImports(), collector.getMessages(), lines, this.options);
    }
    analyzeObject(json) {
        const inlineShift = this.addShift();
        const collector = new Collector();
        const lines = [];
        let index = 1;
        for (const [key, value] of Object.entries(json)) {
            const typeName = this.analyzeProperty(key, value, collector, inlineShift);
            lines.push(`    ${typeName} ${key} = ${index};`);
            index += 1;
        }
        return render(collector.getImports(), collector.getMessages(), lines, this.options);
    }
    analyzeArrayProperty(key, value, collector, inlineShift) {
        // [] -> any
        const length = value.length;
        if (length === 0) {
            collector.addImport(googleAnyImport);
            return `repeated ${googleAny}`;
        }
        // [[...], ...] -> any
        const first = value[0];
        if (Array.isArray(first)) {
            collector.addImport(googleAnyImport);
            return `repeated ${googleAny}`;
        }
        if (length > 1) {
            const primitive = this.samePrimitiveType(value);
            if (primitive.complex === false) {
                return `repeated ${primitive.name}`;
            }
        }
        return `repeated ${this.analyzeObjectProperty(key, first, collector, inlineShift)}`;
    }
    analyzeProperty(key, value, collector, inlineShift) {
        if (Array.isArray(value)) {
            return this.analyzeArrayProperty(key, value, collector, inlineShift);
        }
        return this.analyzeObjectProperty(key, value, collector, inlineShift);
    }
    analyzeObjectProperty(key, value, collector, inlineShift) {
        const typeName = this.analyzeType(value, collector);
        if (typeName === "object") {
            if (this.options.mergeSimilarObjects) {
                const [mergeSimilarObjectKey, canMerge] = this.mergeSimilarObjectKey(value);
                if (canMerge) {
                    if (this.mergeSimilarObjectMap.hasOwnProperty(mergeSimilarObjectKey)) {
                        return this.mergeSimilarObjectMap[mergeSimilarObjectKey];
                    }
                    const messageName = collector.generateUniqueName(toMessageName(key));
                    this.mergeSimilarObjectMap[mergeSimilarObjectKey] = messageName;
                    this.addNested(collector, messageName, value, inlineShift);
                    return messageName;
                }
            }
            const messageName = collector.generateUniqueName(toMessageName(key));
            this.addNested(collector, messageName, value, inlineShift);
            return messageName;
        }
        return typeName;
    }
    mergeSimilarObjectKey(source) {
        const lines = [];
        for (const [key, value] of Object.entries(source)) {
            const [typeName, canMerge] = this.mergeSimilarObjectType(value);
            if (canMerge) {
                lines.push([key, typeName]);
            }
            else {
                return ["", false];
            }
        }
        return [JSON.stringify(lines), true];
    }
    mergeSimilarObjectType(value) {
        if (Array.isArray(value)) {
            return ["", false];
        }
        switch (typeof value) {
            case "string":
                if (this.options.googleProtobufTimestamp && /\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?(\+\d\d:\d\d|Z)/.test(value)) {
                    return [googleTimestamp, true];
                }
                else {
                    return ["string", true];
                }
            case "number":
                return [numberType(value), true];
            case "boolean":
                return ["bool", true];
        }
        return ["", false];
    }
    analyzeType(value, collector) {
        switch (typeof value) {
            case "string":
                if (this.options.googleProtobufTimestamp && /\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?(\+\d\d:\d\d|Z)/.test(value)) {
                    collector.addImport(googleTimestampImport);
                    return googleTimestamp;
                }
                else {
                    return "string";
                }
            case "number":
                return numberType(value);
            case "boolean":
                return "bool";
            case "object":
                if (value === null) {
                    collector.addImport(googleAnyImport);
                    return googleAny;
                }
                return "object";
        }
        collector.addImport(googleAnyImport);
        return googleAny;
    }
    toPrimitiveType(value) {
        switch (typeof value) {
            case "string":
                if (this.options.googleProtobufTimestamp && /\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?(\+\d\d:\d\d|Z)/.test(value)) {
                    return timestampProtoType;
                }
                else {
                    return stringProtoPrimitiveType;
                }
            case "number":
                return new ProtoPrimitiveType(numberType(value), false, true);
            case "boolean":
                return boolProtoPrimitiveType;
        }
        return complexProtoType;
    }
    samePrimitiveType(array) {
        let current = this.toPrimitiveType(array[0]);
        if (current.complex) {
            return current;
        }
        for (let i = 1; i < array.length; i++) {
            const next = this.toPrimitiveType(array[i]);
            if (next.complex) {
                return next;
            }
            current = mergePrimitiveType(current, next);
            if (current.complex) {
                return current;
            }
        }
        return current;
    }
    addNested(collector, messageName, source, inlineShift) {
        const lines = [];
        lines.push(`${inlineShift}message ${messageName} {`);
        let index = 1;
        for (const [key, value] of Object.entries(source)) {
            const typeName = this.analyzeProperty(key, value, collector, inlineShift);
            lines.push(`${inlineShift}    ${typeName} ${key} = ${index};`);
            index += 1;
        }
        lines.push(`${inlineShift}}`);
        collector.addMessage(lines);
    }
    addShift() {
        if (this.options.inline) {
            return `    `;
        }
        return "";
    }
}
function convert(source, options) {
    if (source === "") {
        return new Result("", "");
    }
    // hack that forces floats to stay as floats
    const text = source.replace(/\.0/g, ".1");
    try {
        const json = JSON.parse(text);
        const analyzer = new Analyzer(options);
        return new Result(analyzer.analyze(json), "");
    }
    catch (e) {
        return new Result("", e.message);
    }
}
function toMessageName(source) {
    return source.charAt(0).toUpperCase() + source.substr(1).toLowerCase();
}
function render(imports, messages, lines, options) {
    const result = [];
    result.push(`syntax = "proto3";`);
    if (imports.size > 0) {
        result.push("");
        for (const importName of imports) {
            result.push(`import "${importName}";`);
        }
    }
    result.push("");
    if (options.inline) {
        result.push(`message ${options.outerMessageTitle} {`);
        if (messages.length > 0) {
            result.push("");
            for (const message of messages) {
                result.push(...message);
                result.push("");
            }
        }
        result.push(...lines);
        result.push("}");
    }
    else {
        for (const message of messages) {
            result.push(...message);
            result.push("");
        }
        result.push(`message ${options.outerMessageTitle} {`);
        result.push(...lines);
        result.push("}");
    }
    return result.join("\n");
}
function mergePrimitiveType(a, b) {
    if (a.name === b.name) {
        return a;
    }
    if (a.merge && b.merge) {
        if (a.name === "double") {
            return a;
        }
        if (b.name === "double") {
            return b;
        }
        if (a.name === "int64") {
            return a;
        }
        if (b.name === "int64") {
            return b;
        }
        if (a.name === "uint64") {
            if (b.name === "uint32") {
                return a;
            }
        }
        else if (b.name === "uint64") {
            if (a.name === "uint32") {
                return b;
            }
        }
        return int64ProtoPrimitiveType;
    }
    return complexProtoType;
}
function numberType(value) {
    if (value % 1 === 0) {
        if (value < 0) {
            if (value < -2147483648) {
                return "int64";
            }
            return "int32";
        }
        if (value > 4294967295) {
            return "uint64";
        }
        return "uint32";
    }
    return "double";
}

module.exports = { Options, convert };
