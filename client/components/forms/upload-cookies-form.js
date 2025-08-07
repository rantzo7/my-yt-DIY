class UploadCookiesForm extends HTMLElement {
      constructor () {
        super()
        this.attachShadow({ mode: 'open' })
        this.shadowRoot.innerHTML = `
          <style>
            :host {
              display: block;
              font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif;
            }
            form {
              display: flex;
              flex-direction: column;
              gap: var(--spacing-md);
              padding: 0; /* Handled by settings-card */
              border: none; /* Handled by settings-card */
              border-radius: 0; /* Handled by settings-card */
              background-color: transparent; /* Handled by settings-card */
            }
            label {
              font-weight: 600;
              margin-bottom: var(--spacing-xs);
              color: var(--text-primary);
            }
            input[type="file"] {
              padding: var(--spacing-sm) var(--spacing-md);
              border: 1px solid var(--border-light);
              border-radius: var(--border-radius-sm);
              background-color: var(--bg-input);
              color: var(--text-primary);
              width: 100%;
              box-sizing: border-box;
              transition: border-color 0.2s ease, box-shadow 0.2s ease;
            }
            input[type="file"]:focus {
              outline: none;
              border-color: var(--color-accent-primary);
              box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
            }
            button {
              padding: var(--spacing-xs) var(--spacing-md); /* Smaller padding */
              border: none;
              border-radius: var(--border-radius-sm);
              background-color: var(--color-accent-primary);
              color: var(--color-white);
              cursor: pointer;
              font-size: 0.9rem; /* Smaller font size */
              transition: background-color 0.3s ease, box-shadow 0.3s ease;
              box-shadow: var(--shadow-sm);
              max-width: 200px; /* Limit width */
            }
            button:hover:not(:disabled) {
              background-color: var(--color-accent-hover);
              box-shadow: var(--shadow-md);
            }
            button:disabled {
              background-color: var(--ignore-button-bg);
              cursor: not-allowed;
              box-shadow: none;
            }
            .message {
              margin-top: var(--spacing-md);
              padding: var(--spacing-sm) var(--spacing-md);
              border-radius: var(--border-radius-sm);
              font-size: 0.9em;
              text-align: center;
            }
            .message.success {
              background-color: var(--color-success);
              color: var(--color-white);
            }
            .message.error {
              background-color: var(--color-error);
              color: var(--color-white);
            }
          </style>
          <form>
            <label for="cookies-file">Upload YouTube Cookies (cookies.txt)</label>
            <input type="file" id="cookies-file" accept=".txt" />
            <button type="submit" id="upload-button">Upload cookies.txt</button>
            <div class="message" id="status-message"></div>
          </form>
        `
        this.$fileInput = this.shadowRoot.getElementById('cookies-file')
        this.$uploadButton = this.shadowRoot.getElementById('upload-button')
        this.$statusMessage = this.shadowRoot.getElementById('status-message')

        this.shadowRoot.querySelector('form').addEventListener('submit', this.handleSubmit.bind(this))
        this.$fileInput.addEventListener('change', this.handleFileChange.bind(this))
      }

      handleFileChange () {
        // Reset button and message when a new file is selected
        this.$uploadButton.textContent = 'Upload cookies.txt'
        this.$uploadButton.classList.remove('success', 'error')
        this.$uploadButton.disabled = !this.$fileInput.files.length
        this.$statusMessage.textContent = ''
      }

      async handleSubmit (event) {
        event.preventDefault()

        const file = this.$fileInput.files[0]
        if (!file) {
          this.updateStatus('Please select a cookies.txt file.', 'error')
          return
        }

        this.$uploadButton.textContent = 'Uploading...'
        this.$uploadButton.disabled = true
        this.$uploadButton.classList.remove('success', 'error')
        this.$statusMessage.textContent = ''

        try {
          const fileContent = await this.readFileContent(file)
          const response = await fetch('/api/upload-cookies', {
            method: 'POST',
            headers: {
              'Content-Type': 'text/plain'
            },
            body: fileContent
          })

          if (response.ok) {
            this.updateStatus('Cookies uploaded successfully! You are now logged in to YouTube.', 'success')
          } else {
            const errorText = await response.text()
            this.updateStatus(`Upload failed: ${errorText || response.statusText}`, 'error')
          }
        } catch (error) {
          console.error('Error uploading cookies:', error)
          this.updateStatus(`An error occurred: ${error.message}`, 'error')
        } finally {
          this.$uploadButton.disabled = false
        }
      }

      readFileContent (file) {
        return new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = (event) => resolve(event.target.result)
          reader.onerror = (error) => reject(error)
          reader.readAsText(file)
        })
      }

      updateStatus (message, type) {
        this.$statusMessage.textContent = message
        this.$statusMessage.className = `message ${type}` // Apply class for styling
        this.$uploadButton.classList.remove('success', 'error')
        if (type === 'success') {
          this.$uploadButton.classList.add('success')
          this.$uploadButton.textContent = 'Upload Successful!'
        } else if (type === 'error') {
          this.$uploadButton.classList.add('error')
          this.$uploadButton.textContent = 'Upload Failed!'
        } else {
          this.$uploadButton.textContent = 'Upload cookies.txt'
        }
      }
    }

    customElements.define('upload-cookies-form', UploadCookiesForm)
