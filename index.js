const fetch = require('node-fetch');
const parallel = require('run-parallel')
require('dotenv').config()


var curr = new Date;
var first = curr.getDate() - curr.getDay();
var last = first + 6;

var firstday = new Date(curr.setDate(first)).toISOString();
var lastday = new Date(curr.setDate(last)).toISOString();

async function getContributions(username) {
    const headers = {
        'Authorization': `bearer ${process.env.GITHUB_TOKEN}`,
    }
    const body = {
        "query": `query {
            user(login: "${username}") {
              name
              contributionsCollection(from: "${firstday}", to: "${lastday}") {
                contributionCalendar {
                  totalContributions
                }
              }
            }
          }`
    }
    const response = await fetch('https://api.github.com/graphql', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: headers
    })
    const data = await response.json()
    return data
}


const users = process.env.USERS.split(",");

const callbacks = users.map(user => (callback) => {
    getContributions(user).then(data => {
        callback(null, data);
    })
})

function getData() {
    parallel(callbacks, (err, results) => {
        var data = [];
        results.forEach(response => {
            data.push({
                Name: response.data.user.name,
                Contributions: response.data.user.contributionsCollection.contributionCalendar.totalContributions,
            });
        });

        data = data.sort(function (a, b) {
            return b.Contributions - a.Contributions;
        })
        console.clear();
        console.table(data);
        console.log("Updated: " + (new Date()))

    });
}

getData();
setInterval(() => {
    getData();
}, 10 * 1000)

