function fillList() {

    // List files in local directory
    fetch('/api/woozm_publishers')
    .then(response => response.json())
    .then(data => {
        const list = document.getElementById('woogle-list');
        data.forEach(publisher => {
            const listItem = document.createElement('li');
            listItem.textContent = publisher;
            list.appendChild(listItem);
        });
    })

}

document.addEventListener('DOMContentLoaded', function () {
    fillList();
});