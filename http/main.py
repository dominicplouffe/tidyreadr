from flask import Flask, render_template, send_from_directory, request
from lxml import html
from lxml.html.clean import Cleaner
import requests
import sys
import os

app = Flask(__name__, static_folder='static', static_url_path='/static')
app.secret_key = '1qaz2wsx!'

@app.route('/favicon.ico')
def favicon():
    print os.path.join(app.root_path, 'static')
    return send_from_directory(os.path.join(app.root_path, 'static'),
                'favicon.ico')

@app.route('/')
def home_page_view():
    return render_template(
        'home.html'
    )

@app.route('/fetch')
def fetch_page():

    url = request.args.get('url', None)

    return get_content(url)

def get_content(url):

    if url is None:
        return 'Body is not found!'

    content = requests.get(url).content
    doc = html.fromstring(content)

    cleaner = Cleaner()
    cleaner.javascript = True
    cleaner.style = True
    # cleaner.remove_tags = ['br']

    content = html.tostring(cleaner.clean_html(doc))

    return content

if __name__ == "__main__":

    port = int(sys.argv[1]) if len(sys.argv) > 1 else 5003
    app.run(debug=True, port=port)


def get(url):
    content = requests.get(url).content
    content = content.replace('\r', '')
    content = content.replace('\n', ' ')
    return content
