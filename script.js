const BASE_URL = ' https://api.github.com/'

$('button#search-btn').on('click', async function(){
    //Show loading spinner
    showState('loading');
    //Get input
    const username = $(this).siblings('input').val();
    //Get user data
    const userData = await getGitHubUser(username);
    if (userData === 'ERROR') return showState('none-found')
    console.log(userData);
    //Display data
    const avatarURL = userData.avatar_url;
    const name = userData.name;
    const location = userData.location;
    const repoApiUrl = userData.repos_url;
    const numberOfRepos = userData.public_repos;
    $('img#users-avatar').attr('src', avatarURL );
    $('#user-title').text(username);
    $('span#name').text((name) ? name : 'Not Provided');
    $('span#location').text((location) ? location : 'Not Provided');
    //Get repo data
    let publicRepos = [];
    let iterations = numberOfRepos / 100;
    if (numberOfRepos % 100 > 0) iterations++;
    for (let i=1; i<=iterations; i++){
        const allRepoData = await callGitHubApi(repoApiUrl + `?per_page=100&page=${i}`);
        for (const data of allRepoData){
            publicRepos.push({
                name: data.name,
                fullName: data.full_name,
                description: data.description,
                sgCount: data.stargazers_count,
                starGazersUrl: data.stargazers_url
            })
        }
    }
    console.log(publicRepos);
    //Sort repo data by startgazer numbers
    publicRepos.sort((a,b) => {
        if (a.sgCount > b.sgCount) return -1;
        return 1;
    })
    const topRepos = publicRepos.slice(0, 5);
    //Get stargazer data for top 5 repos and add to table
    $('tbody#repo-tb').empty() //Clear table
    for (const repo of topRepos){
        console.log('Stargazer Numer', repo.sgCount);
        const allStargazers = [];
        let iterations = repo.sgCount / 100;
        if (repo.sgCount % 100 > 0) iterations++;
        for (let i=1; i<=iterations; i++){
            let stargazers = await callGitHubApi(repo.starGazersUrl + `?per_page=100&page=${i}`);
            stargazers = stargazers.map(sg => sg.login);
            allStargazers.push(...stargazers);
        }
       console.log(allStargazers)
        let sgOptions = '';
        for (const sg of allStargazers){
            sgOptions += `<option>${sg}</option>`
        }
        //Add entry to table
        $('tbody#repo-tb').append(`<tr>
            <td>${repo.name}</td>
            <td>${repo.fullName}</td>
            <td>${(repo.description) ? repo.description : 'None Provided'}</td>
            <td><div><select class='form-select form-select-sm'>${sgOptions}</select><div></td>
        </tr>`);
    }
        
    showState('results-div');
})

async function getGitHubUser(username){
    return new Promise((resolve,reject) => {
        const http = new XMLHttpRequest();
        const url = BASE_URL + `users/${username}`;
        http.open('GET', url);
        http.send();
        http.onload = function(){
            if (http.status === 404) resolve('ERROR');
            resolve(JSON.parse(http.responseText));
        }
    })
}

async function callGitHubApi(apiUrl){
    return new Promise((resolve,reject) => {
        const http = new XMLHttpRequest();
        http.open('GET', apiUrl);
        http.send();
        http.onreadystatechange = function(){
            if(this.readyState === 4 && this.status === 200){
                resolve(JSON.parse(http.responseText));
            }
        }
    })
}

function showState(state){
    $('div.state').prop('hidden', true);
    $(`div.state#${state}`).prop('hidden', false);
}