function fillList() {

    // List files in local directory
    fetch('/api/woozm_publishers')
    .then(response => response.json())
    .then(data => {
        const list = document.getElementById('publisher-list');
        data.forEach(publisher => {
            const listItem = document.createElement('tr');
            const publisherName = document.createElement('td');
            const publisherURL = document.createElement('td');

            publisherName.textContent = publisher.name;
            const url = "https://woozm.wooverheid.nl/search?publisher-code=" + publisher.identifier;
            publisherURL.innerHTML = "<a href='" + url + "' target='_blank' >" + url + "</a>";
            
            listItem.appendChild(publisherName);
            listItem.appendChild(publisherURL);

            list.appendChild(listItem);
        });
    })

}

document.addEventListener('DOMContentLoaded', function () {
    fillList();
    console.log("List filled");
});