# AI Scheduler

An AI agent that can help you create your schedule of the day using your google calendar and google tasks.

The AI agent will go through the events that you have planned for the day and the tasks you have in your google tasks.
It will then create a schedule that contains all the events and some of the tasks added in the day.

**Note:** This AI agent is an experimental tool and is not perfect. It may occasionally make mistakes in scheduling or fail to properly prioritize tasks. Always review the generated schedule and make adjustments as needed. The agent's effectiveness will improve with feedback and continued development.

## Installation Steps

1.  **Clone the Repository**

    ```bash
    git clone https://github.com/JorgeVanco/AI-Scheduler.git
    cd AI-Scheduler
    ```

2.  **Set Up Environment**

    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    pip install -r requirements.txt
    ```

3.  **Prepare model to use**

    There are several ways to use free models as your schedulers.
    The first one is using `Ollama` to run you model locally.
    The second option is to use a free model provided by `Together.ai`.

    > **Important**: Verify that the desired model is correctly specified within the `if __name__ == "__main__":` block at the bottom of the `src/agent.py` file.

    1. **Option 1: Download Ollama**

    -   Visit [Ollama's download page](https://ollama.com/download) and install it according to your operating system instructions.

    -   After installing Ollama, run the following command to download the Llama3 8B model:

    ```bash
    ollama pull llama3:8b
    ```

    -   If you prefer to use a different model, you can modify the model initialization in `src/agent.py`:

    ```python
    # Change this line:
    model = ChatOllama(model="llama3:8b")

    # To use a different model like:
    # model = ChatOllama(model="mistral:7b")
    # model = ChatOllama(model="gemma:7b")
    # Or any other model supported by Ollama or any other provider you might want to use
    ```

    You'll need to pull your chosen model first using `ollama pull model_name`.

    2. **Option 2: Get your Together.ai API key**

    -   Visit [Together.ai settings](https://api.together.ai/settings/api-keys) to get your API key.
    -   Create a `.env` file in the project root directory
    -   Add the `TOGETHER_API_KEY` variable with the api key.

    ```
    TOGETHER_API_KEY=your-together-api-key
    ```

    -   To use the Together.ai inference provider, you'll have to change the model initialization:

    ```python
    model = ChatTogether(model="meta-llama/Llama-3.3-70B-Instruct-Turbo-Free")
    ```

4.  **Configure Google API Credentials**

    To allow your application to access Google Calendar and Google Tasks on your behalf, follow these steps to configure your Google API credentials:

    1. **Go to the [Google Cloud Console](https://console.cloud.google.com/)**  
       You’ll need to be signed into your Google account.

    2. **Create a new project**

        - Click on the project dropdown (top-left) and select **"New Project"**.
        - Give your project a name and click **"Create"**.

    3. **Enable APIs**

        - In the project dashboard, go to **"APIs & Services" > "Library"**.
        - Search for and **enable the following APIs**:
            - **Google Calendar API**
            - **Google Tasks API**

    4. **Create OAuth 2.0 credentials**

        - Navigate to **"APIs & Services" > "Credentials"**.
        - Click **"Create Credentials"** and choose **"OAuth client ID"**.
        - Configure the consent screen:
            - Go to **"OAuth consent screen"**.
            - Choose **"External"** and click **"Create"**.
            - Fill in the required fields (App name, User support email, etc.).
            - Under **"Test users"**, add your Google email address.
        - Return to the **Credentials** page.
        - Select **"Application type: Desktop app"** or **"Web application"** (depending on your use case).
        - Download the generated `credentials.json` file.

    5. **Place the `credentials.json` file in the project root directory**  
       This is where your app will look for the file during authentication.

5.  **Add CALENDAR_ID to environment variables**

    -   Create a `.env` file in the project root directory
    -   You can get your calendar ID from the calendar configuration at Google Calendar.
    -   Your main calendar will probably have your email as ID.
    -   Add the `CALENDAR_ID` variable with the id of the calendar to which you want the agent to add the events.

    ```
    CALENDAR_ID=your-calendar-id
    ```

6.  **Configure Langfuse for Tracking (Optional)**

    -   Go to [Langfuse](https://langfuse.com) and create an account
    -   Create a new project and get your API keys
    -   Create a `.env` file in the project root directory
    -   Add your Langfuse credentials:

    ```
    LANGFUSE_SECRET_KEY=sk-your-langfuse-secret-key
    LANGFUSE_PUBLIC_KEY=pk-your-langfuse-public-key
    LANGFUSE_HOST=https://cloud.langfuse.com
    ```

    Alternatively, if you don't want to use Langfuse, open `src/agent.py` and remove or comment out all code related to `langfuse_handler`.

7.  **Run the Application**

    ```bash
    python -m src.agent
    ```

8.  **First Run Authorization**

    -   On first run, the application will open a browser window
    -   Log in with your Google account and authorize the application
    -   The app will save your tokens locally in the file for `token.json` future use

9.  **Set Up GitHub Actions for Scheduled Execution (Optional)**

    If you'd like to run the AI Scheduler automatically on a daily schedule using GitHub Actions:

    1. **Make sure to run the app to make sure that your token.json is not expired.**
    2. **Make sure you are using a cloud provider instead of Ollama.**
    3. **Convert the contents of `credentials.json` and `token.json` to Base64 to add them as secrets.**

        - On Linux / macOS

        ```bash
            base64 -w 0 credentials.json
            base64 -w 0 token.json
        ```

        - On Windows (PowerShell):

        ```powershell
            [Convert]::ToBase64String([IO.File]::ReadAllBytes("credentials.json"))
            [Convert]::ToBase64String([IO.File]::ReadAllBytes("token.json"))
        ```

        - On Windows CMD

        ```cmd
            powershell -Command "[Convert]::ToBase64String([IO.File]::ReadAllBytes('credentials.json'))"
            powershell -Command "[Convert]::ToBase64String([IO.File]::ReadAllBytes('token.json'))"
        ```

    4. **Fork repository**

        You need to fork the repository so you can add your own GitHub secrets required for the GitHub Actions workflow. Only repository owners can add secrets, so forking gives you the necessary access to set up and run the scheduled workflow.

        > **Tip:** After forking, you can still pull in updates from the original repository by setting it as an upstream remote.

    5. **Add the Following GitHub Secrets.**

        In your GitHub repository, go to **Settings > Secrets and Variables > Actions**, then add the following secrets:

        | Secret Name              | Value (from base64 or actual data)                                  |
        | ------------------------ | ------------------------------------------------------------------- |
        | `GOOGLE_CREDENTIALS_B64` | Content of `credentials.b64.txt`                                    |
        | `GOOGLE_TOKEN_B64`       | Content of `token.b64.txt`                                          |
        | `HUGGINGFACE_TOKEN`      | Your HuggingFace API token (if using HF provider)                   |
        | `TOGETHER_API_KEY`       | Your Together.ai API key                                            |
        | `CALENDAR_ID`            | Your target Google Calendar ID                                      |
        | `LANGFUSE_SECRET_KEY`    | Langfuse secret key _(optional)_                                    |
        | `LANGFUSE_PUBLIC_KEY`    | Langfuse public key _(optional)_                                    |
        | `LANGFUSE_HOST`          | Langfuse host URL (e.g., `https://cloud.langfuse.com`) _(optional)_ |

    6. **GitHub Actions Workflow: Scheduled and Manual Runs**

        The GitHub Actions workflow named `Run Scheduler` is configured to run automatically every day at 5:00 UTC (which is 7:00 in Spain) using this schedule:

        ```yaml
        on:
        schedule:
            # Runs every day at 5:00 UTC, 7:00 in Spain
            - cron: "0 5 * * *"

        # Allow manual trigger too
        workflow_dispatch:
        ```

        - The `schedule` event triggers the job daily at the specified time.
        - The `workflow_dispatch` event allows you to **manually trigger** the workflow whenever you want.

        You can manually trigger the workflow by going to the **Actions** tab in your GitHub repository, selecting the `Run Scheduler` workflow, and clicking the **Run workflow** button.

        This flexibility lets you run the scheduler on demand or automatically on a set schedule.
