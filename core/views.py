from django.shortcuts import render

def index(request):
    """
    Main view that serves the index.html template
    """
    return render(request, 'index.html')

def api_test(request):
    """
    View that serves the API test page
    """
    return render(request, 'api-test.html')

def livecasino(request):
    """
    View that serves the livecasino.html template
    """
    return render(request, 'livecasino.html')

def slot(request):
    """
    View that serves the slot.html template
    """
    return render(request, 'slot.html')

def fantasy(request):
    """
    View that serves the fantasy.html template
    """
    return render(request, 'fantasy.html')

def createaccount(request):
    """
    View that serves the createaccount.html template
    """
    return render(request, 'createaccount.html')
