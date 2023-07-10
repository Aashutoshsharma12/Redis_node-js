const express = require('express')
const app = express();
app.use(express.json())
// import Redis from 'ioredis'
const redis = require('ioredis')
// const redisClient = new Redis();
//send message
const channel = 'news';
const message = 'New article published';
// import redis from 'redis'
// const redis = require('redis')

const publisher = redis.createClient({ host: '127.0.0.1', port: 6379, auth_pass: "P@ssw0rd" });
app.get('/', (req, res) => {
    res.send('Redis Publisher active at 3098')
})

app.get('/publish', async (req, res) => {
    try {
        const id = 12
        const product = {
            id, name: `product${id}`
        }
        publisher.publish('products', JSON.stringify(product), (err, reply) => {
            if (err) {
                console.error(err, "err");
                res.send('Failed to publish the product');
            } else {
                res.send('Product published successfully');
            }
        });
    } catch (error) {
        console.log(error)
    }
})

//add data in redis
app.post('/addData', async (req, res) => {
    try {
        var key = req.body.keyName
        var obj = {
            id: req.body.id,
            name: req.body.name
        }
        const value = JSON.stringify(obj);
        publisher.set(key, value, (error, reply) => {
            // publisher.set('name12',"asbhu", (error, reply) => {
            if (error) {
                res.send(error);
            } else {
                res.send(reply)
            }
        });
    } catch (error) {
        console.log(error)
    }
})

//get data from redis using key name
app.get('/getData', (req, res) => {
    try {
        var keyName = 'details'
        publisher.get(keyName, (error, value) => {
            if (error) {
                res.send(error)
            } else {
                res.send(value)
                // publisher.quit();
            }
        });
    } catch (error) {
        console.log(error)
    }
})

//list 
app.get('/list', (req, res) => {
    try {
        var data = []
        var data11 = []
        let retrievedKeys = 0;
        publisher.keys('*', (error, keys) => {
            if (error) {
                res.send(error);
            } else {
                if (keys.length === 0) {
                    res.status(200).json(data);
                }
                keys.forEach((key) => {
                    publisher.get(key, (err, value) => {
                        if (err) {
                            res.send(err);
                        }
                        console.log(value, "slsl")
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
    } catch (error) {
        console.log(error)
    }
});
//delete data from redis
app.post('/delete', (req, res) => {
    try {
        var keyName = req.body.keyName
        publisher.del(keyName, (err, value) => {
            if (err) {
                res.status(400).json(err)
            } else {
                res.status(200).json(value)
            }
        })
    } catch (err) {
        console.log(err)
    }
})

//pagination in list
app.post('/pagination_list', (req, res) => {
    try {
        var pageNumber = req.body.pageNo ? req.body.pageNo : 1;
        var itemsPerPage = req.body.perPage ? req.body.perPage : 1;
        const startIndex = (pageNumber - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage - 1;
        console.log(startIndex, "s;lsls", endIndex)
        // Assuming you have a Redis list named 'myDataList'
        publisher.lrange('name1', startIndex, endIndex, (err, data) => {
            if (err) {
                res.json(err);
            } else {
                res.json(data);
            }
        });
    } catch (error) {
        console.log(error)
    }
})

//search data 
app.get('/searchData', async (req, res) => {
    try {
        var cursor = '0'; // Initial cursor value
        let keys = [];
        const pattern = req.body.key + "*";
        // do {
        //     const [newCursor, retrievedKeys] = await publisher.scan(cursor, 'MATCH', pattern);
        //     cursor = newCursor;
        //     keys.push(...retrievedKeys);
        // } while (cursor !== '0');
        const [newcursor, retrievedKeys] = await publisher.scan(cursor, 'MATCH', pattern);
        if (retrievedKeys.length) {
            for (let i = 0; i < retrievedKeys.length; i++) {
                const data = await publisher.get(retrievedKeys[i]);
                keys.push({ key: retrievedKeys[i], details: JSON.parse(data) });
            }
            res.json({ data: keys });
        } else {
            res.json({ data: keys });
        }

    } catch (err) {
        console.log(err)
    }
})

//multisearch
app.get('/multi_search', async (req, res) => {
    try {
        // const searchPatterns = ['name*', 'key'];
        const searchPatterns = req.body.search
        let matchingKeys = []
        const multi = publisher.multi();
        for (const pattern of searchPatterns) {
            multi.scan(0, 'MATCH', pattern);
        }
        const searchResults = await multi.exec();
        console.log(searchPatterns, "slls")
        for (const [result, error] of searchResults) {
            if (error) {
                console.error('Error executing search:', error);
            } else {
                const [, keys] = result;
                matchingKeys.push(...keys);
            }
        }
        res.json({ data: matchingKeys })
    } catch (err) {
        console.log(err)
    }
})

//Add data in list
app.post('/addList', (req, res) => {
    try {
        var list = req.body.listName
        var value1 = { "data": 'ss', "data2": "21" }
        var value = { "data": 'ss1', "data2": "2" }
        const value2 = JSON.stringify(value);
        const value3 = JSON.stringify(value1);

        // For adding data to a list:
        const data = publisher.rpush(list, value3, value2);
        console.log({ data: data })
        res.json({ data: data })
    } catch (err) {
        console.log(err);
    }
})
app.post('/updateList', (req, res) => {
    try {
        var list = req.body.listName
        var index = 2
        var updateValue = JSON.stringify({ "data": 'ss12', "data2": "21" })
        publisher.lset(list, index, updateValue, (err, reply) => {
            if (err) {
                console.log(err);
            } else {
                res.json({ data: reply })
            }
        })
    } catch (err) {
        console.log(err)
    }
});
//get  list data
app.post('/getList', (req, res) => {
    try {
        var array = []
        //get list
        publisher.lrange(req.body.listName, 0, -1, (error, response) => {
            if (error) {
                console.error(error);
                return;
            }
            console.log('List elements:', (response));
            response.map((data) => {
                array.push(JSON.parse(data))
            })
            res.json({ data: array })
        });
    } catch (err) {
        console.log(err);
    }
})
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
            res.json({ message: "List deleted successfully" })
        })
    } catch (err) {
        console.log(err);
    }
})

//Add data in Hash
app.post('/addHash', (req, res) => {
    try {
        var key = req.body.key
        var value = req.body.value
        const data = publisher.hset(req.body.hashName, key, value);
        console.log({ data: data })
        res.json({ data: data })
    } catch (err) {
        console.log(err);
    }
})
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
            res.json({ data: response })
        });
    } catch (err) {
        console.log(err);
    }
})
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
            res.json({ message: "Hash deleted successfully" })
        })
    } catch (err) {
        console.log(err);
    }
})
//get all hash data
app.post('/searchHash_data', (req, res) => {
    try {

        const hashKey = req.body.hashName;
        const searchField = req.body.key;
        const searchValue = req.body.value;
        console.log(hashKey, "slkdkd", searchField, ",mcmc", searchValue)
        publisher.hscan(hashKey, 0, 'MATCH', `*${searchField}*${searchValue}*`, (error, result) => {
            if (error) {
                console.error(error);
                return;
            }
            const matchingFields = result[1];
            res.json({ data: matchingFields })
            console.log('Matching Fields:', matchingFields);
        });
    } catch (error) {
        console.log(error)
    }
})

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
                            res.json({ data: results })
                            // Handle the retrieved data here
                        }
                    });
                });
            } else {
                res.json({ data: [] })
            }

            // console.log('All Hash Keys:', keys);

        })
    } catch (error) {
        console.log(error)
    }
})


publisher.on('error', (error) => {
    console.error('Redis Error:', error);
});
publisher.on('connected', (error) => {
    console.error('Redis connected:', error);
});

// Close the connection when done
//   publisher.quit();
app.listen(3098, () => {
    console.log('Server is running on 3098')
})