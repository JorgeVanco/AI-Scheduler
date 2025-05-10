# AI Scheduler

An AI agent that can help you create your schedule of the day using your google calendar and google tasks.

The AI agent will go through the events that you have planned for the day and the tasks you have in your google tasks.
It will then create a schedule that contains all the events and some of the tasks added in the day.

**Note:** This AI agent is an experimental tool and is not perfect. It may occasionally make mistakes in scheduling or fail to properly prioritize tasks. Always review the generated schedule and make adjustments as needed. The agent's effectiveness will improve with feedback and continued development.

## Installation Steps

1. **Clone the Repository**

    ```bash
    git clone https://github.com/JorgeVanco/AI-Scheduler.git
    cd AI-Scheduler
    ```

2. **Set Up Environment**

    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    pip install -r requirements.txt
    ```

3. **Download Ollama**

    Visit [Ollama's download page](https://ollama.com/download) and install it according to your operating system instructions.

    After installing Ollama, run the following command to download the Llama3 8B model:

    ```bash
    ollama pull llama3:8b
    ```

    If you prefer to use a different model, you can modify the model initialization in `src/agent.py`:

    ```python
    # Change this line:
    llm = ChatOllama(model="llama3:8b")

    # To use a different model like:
    # llm = ChatOllama(model="mistral:7b")
    # llm = ChatOllama(model="gemma:7b")
    # Or any other model supported by Ollama or any other provider you might want to use
    ```

    You'll need to pull your chosen model first using `ollama pull model_name`.

4. **Configure Google API Credentials**

    - Go to the [Google Cloud Console](https://console.cloud.google.com/)
    - Create a new project
    - Enable the Google Calendar API and Google Tasks API
    - Create OAuth 2.0 credentials and download the `credentials.json` file
    - Place the `credentials.json` file in the project root directory

5. **Add CALENDAR_ID to environment variables**
    - Create a `.env` file in the project root directory
    - Add the `CALENDAR_ID` variable with the id of the calendar to which you want the agent to add the events. 
    - You can get your calendar ID from the calendar configuration at Google Calendar.
    - Your main calendar will probably have your email as ID.

6. **Configure Langfuse for Tracking (Optional)**

    - Go to [Langfuse](https://langfuse.com) and create an account
    - Create a new project and get your API keys
    - Create a `.env` file in the project root directory
    - Add your Langfuse credentials:

    ```
    LANGFUSE_SECRET_KEY=your_secret_key
    LANGFUSE_PUBLIC_KEY=your_public_key
    LANGFUSE_HOST=https://cloud.langfuse.com
    ```

    Alternatively, if you don't want to use Langfuse, open `src/agent.py` and remove or comment out all code related to `langfuse_handler`.

7. **Run the Application**

    ```bash
    python -m src.agent
    ```

8. **First Run Authorization**
    - On first run, the application will open a browser window
    - Log in with your Google account and authorize the application
    - The app will save your tokens locally for future use
