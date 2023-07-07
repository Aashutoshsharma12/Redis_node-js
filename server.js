"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
// import Redis from 'ioredis'
const redis = require('ioredis');
// const redisClient = new Redis();
//send message
const channel = 'news';
const message = 'New article published';
// import redis from 'redis'
// const redis = require('redis')
const publisher = redis.createClient({ host: '127.0.0.1', port: 6379, auth_pass: "P@ssw0rd" });
app.get('/', (req, res) => {
    res.send('Redis Publisher active at 3098');
});
app.get('/publish', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = 12;
        const product = {
            id, name: `product${id}`
        };
        publisher.publish('products', JSON.stringify(product), (err, reply) => {
            if (err) {
                console.error(err, "err");
                res.send('Failed to publish the product');
            }
            else {
                res.send('Product published successfully');
            }
        });
    }
    catch (error) {
        console.log(error);
    }
}));
//add data in redis
app.post('/addData', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        var key = req.body.keyName;
        var obj = {
            id: req.body.id,
            name: req.body.name
        };
        const value = JSON.stringify(obj);
        publisher.set(key, value, (error, reply) => {
            // publisher.set('name12',"asbhu", (error: any, reply: any) => {
            if (error) {
                res.send(error);
            }
            else {
                res.send(reply);
            }
        });
    }
    catch (error) {
        console.log(error);
    }
}));
//get data from redis using key name
app.get('/getData', (req, res) => {
    try {
        var keyName = 'details';
        publisher.get(keyName, (error, value) => {
            if (error) {
                res.send(error);
            }
            else {
                res.send(value);
                // publisher.quit();
            }
        });
    }
    catch (error) {
        console.log(error);
    }
});
//list 
app.get('/list', (req, res) => {
    try {
        var data = [];
        var data11 = [];
        let retrievedKeys = 0;
        publisher.keys('*', (error, keys) => {
            if (error) {
                res.send(error);
            }
            else {
                if (keys.length === 0) {
                    res.status(200).json(data);
                }
                keys.forEach((key) => {
                    publisher.get(key, (err, value) => {
                        if (err) {
                            res.send(err);
                        }
                        console.log(value, "slsl");
                        data.push({ key, value: JSON.parse(value) });
                        // data.push({ key, value: value });
                        retrievedKeys++;
                        if (retrievedKeys === keys.length) {
                            res.status(200).json(data);
                        }
                    });
                });
            }
        });
    }
    catch (error) {
        console.log(error);
    }
});
//delete data from redis
app.post('/delete', (req, res) => {
    try {
        var keyName = req.body.keyName;
        publisher.del(keyName, (err, value) => {
            if (err) {
                res.status(400).json(err);
            }
            else {
                res.status(200).json(value);
            }
        });
    }
    catch (err) {
        console.log(err);
    }
});
//pagination in list
app.post('/pagination_list', (req, res) => {
    try {
        var pageNumber = req.body.pageNo ? req.body.pageNo : 1;
        var itemsPerPage = req.body.perPage ? req.body.perPage : 1;
        const startIndex = (pageNumber - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage - 1;
        console.log(startIndex, "s;lsls", endIndex);
        // Assuming you have a Redis list named 'myDataList'
        publisher.lrange('name1', startIndex, endIndex, (err, data) => {
            if (err) {
                res.json(err);
            }
            else {
                res.json(data);
            }
        });
    }
    catch (error) {
        console.log(error);
    }
});
//search data 
app.get('/searchData', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        var cursor = '0'; // Initial cursor value
        let keys = [];
        const pattern = req.body.key + "*";
        // do {
        //     const [newCursor, retrievedKeys] = await publisher.scan(cursor, 'MATCH', pattern);
        //     cursor = newCursor;
        //     keys.push(...retrievedKeys);
        // } while (cursor !== '0');
        const [newcursor, retrievedKeys] = yield publisher.scan(cursor, 'MATCH', pattern);
        if (retrievedKeys.length) {
            for (let i = 0; i < retrievedKeys.length; i++) {
                const data = yield publisher.get(retrievedKeys[i]);
                keys.push({ key: retrievedKeys[i], details: JSON.parse(data) });
            }
            res.json({ data: keys });
        }
        else {
            res.json({ data: keys });
        }
    }
    catch (err) {
        console.log(err);
    }
}));
//multisearch
app.get('/multi_search', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // const searchPatterns = ['name*', 'key'];
        const searchPatterns = req.body.search;
        let matchingKeys = [];
        const multi = publisher.multi();
        for (const pattern of searchPatterns) {
            multi.scan(0, 'MATCH', pattern);
        }
        const searchResults = yield multi.exec();
        console.log(searchPatterns, "slls");
        for (const [result, error] of searchResults) {
            if (error) {
                console.error('Error executing search:', error);
            }
            else {
                const [, keys] = result;
                matchingKeys.push(...keys);
            }
        }
        res.json({ data: matchingKeys });
    }
    catch (err) {
        console.log(err);
    }
}));
//Add data in list
app.post('/addList', (req, res) => {
    try {
        var list = req.body.listName;
        var value = req.body.value;
        // For adding data to a list:
        const data = publisher.rpush(list, 'item1', 'item2', 'item3');
        console.log({ data: data });
        res.json({ data: data });
    }
    catch (err) {
        console.log(err);
    }
});
//get  list data
app.post('/getList', (req, res) => {
    try {
        //get list
        publisher.lrange(req.body.listName, 0, -1, (error, response) => {
            if (error) {
                console.error(error);
                return;
            }
            console.log('List elements:', response);
            res.json({ data: response });
        });
    }
    catch (err) {
        console.log(err);
    }
});
//delete  list 
app.post('/deleteList', (req, res) => {
    try {
        //delete list
        publisher.del(req.body.listName, (error, response) => {
            if (error) {
                console.error(error);
                return;
            }
            console.log('List deleted successfully');
            res.json({ message: "List deleted successfully" });
        });
    }
    catch (err) {
        console.log(err);
    }
});
//Add data in Hash
app.post('/addHash', (req, res) => {
    try {
        var key = req.body.key;
        var value = req.body.value;
        const data = publisher.hset(req.body.hashName, key, value);
        console.log({ data: data });
        res.json({ data: data });
    }
    catch (err) {
        console.log(err);
    }
});
//get  hash data
app.post('/getHash', (req, res) => {
    try {
        //get hash
        publisher.hgetall(req.body.hashName, (error, response) => {
            if (error) {
                console.error(error);
                return;
            }
            console.log('List elements:', response);
            res.json({ data: response });
        });
    }
    catch (err) {
        console.log(err);
    }
});
//delete  hash 
app.post('/deleteHash', (req, res) => {
    try {
        //delete hash
        publisher.del(req.body.hashName, (error, response) => {
            if (error) {
                console.error(error);
                return;
            }
            console.log('hash deleted successfully');
            res.json({ message: "Hash deleted successfully" });
        });
    }
    catch (err) {
        console.log(err);
    }
});
//get all hash data
app.post('/searchHash_data', (req, res) => {
    try {
        const hashKey = req.body.hashName;
        const searchField = req.body.key;
        const searchValue = req.body.value;
        console.log(hashKey, "slkdkd", searchField, ",mcmc", searchValue);
        publisher.hscan(hashKey, 0, 'MATCH', `*${searchField}*${searchValue}*`, (error, result) => {
            if (error) {
                console.error(error);
                return;
            }
            const matchingFields = result[1];
            res.json({ data: matchingFields });
            console.log('Matching Fields:', matchingFields);
        });
    }
    catch (error) {
        console.log(error);
    }
});
//all hash
app.post('/allHash', (req, res) => {
    try {
        const results = [];
        publisher.keys('*', (error, keys) => {
            if (error) {
                console.error(error);
                return;
            }
            if (keys.length) {
                keys.forEach((key) => {
                    publisher.hgetall(key, (error, value) => {
                        if (error) {
                            console.error(error);
                            return;
                        }
                        results.push({ key, value });
                        if (results.length === keys.length) {
                            console.log('Hash Data:', results);
                            res.json({ data: results });
                            // Handle the retrieved data here
                        }
                    });
                });
            }
            else {
                res.json({ data: [] });
            }
            // console.log('All Hash Keys:', keys);
        });
    }
    catch (error) {
        console.log(error);
    }
});
publisher.on('error', (error) => {
    console.error('Redis Error:', error);
});
// Close the connection when done
//   publisher.quit();
app.listen(3098, () => {
    console.log('Server is running on 3098');
});