[![horizontal_blue(2)](https://user-images.githubusercontent.com/2264338/193489167-7c9ffb17-a9fe-4af1-9598-a12605eb6b48.png)](https://cerebralfix.com)


## configjoy
`configjoy` is a command line tool and GUI for structured, type safe editing of configuration files. Behind the scenes it uses [Protocol Buffers](https://developers.google.com/protocol-buffers) to define the schema for these files, which allows you to automatically generate serialization code in most programming languages.

*Note: configjoy is currently in active development and hasn't yet reached it's 1.0 release. Expect breaking changes on upgrade.*

It has three main use cases:

#### 1. Open a well known config file with built in structured editing support
`configjoy package.json`
![Screen Shot 2022-10-04 at 4 31 45 PM](https://user-images.githubusercontent.com/2264338/193728611-8012544e-081d-4f70-8608-5e58c7a19e31.png)

#### 2. Auto generate a `.proto` schema for an unknown config file
`configjoy books.json`

![Screen Shot 2022-10-06 at 9 38 02 AM](https://user-images.githubusercontent.com/2264338/194158836-9215dc7f-046d-4a55-9b14-201ea54e613f.png)

![Screen Shot 2022-10-06 at 9 39 07 AM](https://user-images.githubusercontent.com/2264338/194158988-37157fa2-beb0-42c7-9498-8c696464d91a.png)

#### 3. Use your own schema to edit an existing config file
`configjoy --schema schema/books.proto books.json`

![Screen Shot 2022-10-06 at 9 41 40 AM](https://user-images.githubusercontent.com/2264338/194159400-a68b2c66-de6b-40f7-a54f-a1bb3e374574.png)


This utility was developed at [CerebralFix](https://cerebralfix.com).

#### Contributors
[Nic Barker](https://github.com/nicbarker)

See [CONTRIBUTING.md](https://github.com/nicbarker/gameconfig/blob/main/CONTRIBUTING.md)

#### Custom config file usage guide

**1. Create a proto file**

<img width="788" alt="Screen Shot 2022-09-06 at 11 50 51 AM" src="https://user-images.githubusercontent.com/2264338/188521544-69f0386c-5d12-4dce-9294-49b07382790f.png">

`configjoy --schema schema/books.proto --files data/books.json`

**2. Admin interface for the file is auto generated**

![Screen Shot 2022-10-03 at 4 12 07 PM](https://user-images.githubusercontent.com/2264338/193495143-b43111ad-e63a-4945-9348-b5f9d27f76fb.png)

**Admin interface live updates the backing .json data file**

https://user-images.githubusercontent.com/2264338/188754293-faa6aa77-e02e-441c-85cc-36861fe19e46.mov

**C# Integration allows Unity to hot reload the data**

https://user-images.githubusercontent.com/2264338/188754365-1f0116a1-7ef1-4c72-95f4-4a7c652a2a43.mov

#### Interface usage guide
- Cut, copy and paste are enables when array elements are selected. Paste will insert the copied data after the last selected array element.
- Undo & Redo are a custom implementation and will undo array element deletion, field value changes etc.
- All changes are propagated on _blur_ i.e. when you click your cursor outside of an input field.
