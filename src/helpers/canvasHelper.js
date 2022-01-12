const Canvas = require('canvas')

class CanvasHelper {

    constructor() {
        this.defaults = {
            bgColor: '#fff',
            customHeight: 0,
            debug: false,
            debugFilename: '',
            fontFamily: 'Helvetica',
            fontPath: '',
            fontSize: 18,
            fontWeight: 'normal',
            lineHeight: 28,
            margin: 10,
            maxWidth: 400,
            textAlign: 'left',
            textColor: '#000',
            verticalAlign: 'top',
            keepSpaces: false,
        };
    };

    createTextData(text, config, canvas) {
        const {
            bgColor,
            fontFamily,
            fontPath,
            fontSize,
            fontWeight,
            lineHeight,
            maxWidth,
            textAlign,
            textColor,
            keepSpaces,
        } = config;

        // Register a custom font
        if (fontPath) {
            Canvas.registerFont(fontPath, { family: fontFamily });
        }

        // Use the supplied canvas (which should have a suitable width and height)
        // for the final image
        // OR
        // create a temporary canvas just for measuring how long the canvas needs to be
        const textCanvas = canvas || Canvas.createCanvas(maxWidth, 100);
        const textContext = textCanvas.getContext('2d');

        // set the text alignment and start position
        let textX = 0;
        let textY = 0;

        if (['center'].includes(textAlign.toLowerCase())) {
            textX = maxWidth / 2;
        }
        if (['right', 'end'].includes(textAlign.toLowerCase())) {
            textX = maxWidth;
        }
        textContext.textAlign = textAlign;

        // set background color
        textContext.fillStyle = bgColor;
        textContext.fillRect(0, 0, textCanvas.width, textCanvas.height);

        // set text styles
        textContext.fillStyle = textColor;
        textContext.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
        textContext.textBaseline = 'top';

        if(!keepSpaces) {
            [textX = textX, textY = textY] = this.handleIgnoreSpaceText(ignoreSpaceText, textContext, maxWidth, textX, textY, lineHeight);
        } else {
            //split the text into lines
            const lines = text.split('\n');

            const ignoreSpaceLinesArray = lines.splice(0, 2);
            const ignoreSpaceText = ignoreSpaceLinesArray.  join('\n ');
            [textX = textX, textY = textY] = this.handleIgnoreSpaceText(ignoreSpaceText, textContext, maxWidth, textX, textY, lineHeight);
            textY += lineHeight;
            
            lines.forEach(line => {
                textContext.fillText(line, textX, textY);
                // move the pen down
                textY += lineHeight;
            })
        }

        // increase the size of the text layer by the line height,
        // but in case the line height is less than the font size
        // we increase by font size in order to prevent clipping
        const height = textY + Math.max(lineHeight, fontSize);

        return {
            textHeight: height,
            textData: textContext.getImageData(0, 0, maxWidth, height),
        };
    }

    handleIgnoreSpaceText(text, textContext, maxWidth, textX, textY, lineHeight) {
        // split the text into words
        const words = text.split(' ');
        let wordCount = words.length;

        // the start of the first line
        let line = '';
        const addNewLines = [];

        for (let n = 0; n < wordCount; n += 1) {
            let word = words[n];

            if (/\n/.test(words[n])) {
                const parts = words[n].split('\n');
                // use the first word before the newline(s)
                word = parts.shift() || '';
                // mark the next word as beginning with newline
                addNewLines.push(n + 1);
                // return the rest of the parts to the words array at the same index
                words.splice(n + 1, 0, parts.join('\n'));
                wordCount += 1;
            }

            // append one word to the line and see
            // if its width exceeds the maxWidth
            // also trim the testLine since `line` will be empty in the beginning,
            // causing a leading white space character otherwise
            const testLine = `${line} ${word}`.replace(/^ +/, '').replace(/ +$/, '');
            const testLineWidth = textContext.measureText(testLine).width;

            // if the line is marked as starting with a newline
            // OR if the line is too long, add a newline
            if (addNewLines.indexOf(n) > -1 || (testLineWidth > maxWidth && n > 0)) {
                // if the line exceeded the width with one additional word
                // just paint the line without the word
                textContext.fillText(line, textX, textY);

                // start a new line with the last word
                // and add the following (if this word was a newline word)
                line = word;

                // move the pen down
                textY += lineHeight;
            } else {
                // if not exceeded, just continue
                line = testLine;
            }
        }

        // paint the last line
        textContext.fillText(line, textX, textY);

        return [textX, textY];
    }

    createCanvas(content, conf) {
        // First pass: measure the text so we can create a canvas
        // big enough to fit the text. This has to be done since we can't
        // resize the canvas on the fly without losing the settings of the 2D context
        // https://github.com/Automattic/node-canvas/issues/1625
        const { textHeight } = this.createTextData(
            content,
            // max width of text itself must be the image max width reduced by left-right margins
            {
                maxWidth: conf.maxWidth - conf.margin * 2,
                fontSize: conf.fontSize,
                lineHeight: conf.lineHeight,
                bgColor: conf.bgColor,
                textColor: conf.textColor,
                fontFamily: conf.fontFamily,
                fontPath: conf.fontPath,
                fontWeight: conf.fontWeight,
                textAlign: conf.textAlign,
                keepSpaces: conf.keepSpaces
            },
        );

        const textHeightWithMargins = textHeight + conf.margin * 2;

        if (conf.customHeight && conf.customHeight < textHeightWithMargins) {
            // eslint-disable-next-line no-console
            console.warn('Text is longer than customHeight, clipping will occur.');
        }

        // Second pass: we now know the height of the text on the canvas,
        // so let's create the final canvas with the given height and width
        // and pass that to createTextData so we can get the text data from it
        const canvas = Canvas.createCanvas(
            conf.maxWidth,
            conf.customHeight || textHeightWithMargins,
        );

        const { textData } = this.createTextData(
            content,
            // max width of text itself must be the image max width reduced by left-right margins
            {
                maxWidth: conf.maxWidth - conf.margin * 2,
                fontSize: conf.fontSize,
                lineHeight: conf.lineHeight,
                bgColor: conf.bgColor,
                textColor: conf.textColor,
                fontFamily: conf.fontFamily,
                fontPath: conf.fontPath,
                fontWeight: conf.fontWeight,
                textAlign: conf.textAlign,
                keepSpaces: conf.keepSpaces
            },
            canvas,
        );
        const ctx = canvas.getContext('2d');

        // the canvas will have the text from the first pass on it,
        // so start by clearing the whole canvas and start from a clean slate
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1;
        ctx.fillStyle = conf.bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const textX = conf.margin;
        let textY = conf.margin;
        if (conf.customHeight && conf.verticalAlign === 'center') {
            textY =
                // divide the leftover whitespace by 2
                (conf.customHeight - textData.height) / 2 +
                // offset for the extra space under the last line to make bottom and top whitespace equal
                // but only up until the bottom of the text
                // (i.e. don't consider a linheight less than the font size)
                Math.max(0, (conf.lineHeight - conf.fontSize) / 2);
        }

        ctx.putImageData(textData, textX, textY);

        return canvas;
    }

    async generate(content, config) {
        const conf = { ...this.defaults, ...config };
        const canvas = this.createCanvas(content, conf);
        const dataUrl = canvas.toDataURL();

        if (conf.debug) {
            const fileName =
                conf.debugFilename ||
                `${new Date().toISOString().replace(/[\W.]/g, '')}.png`;
            await fs.promises.writeFile(fileName, canvas.toBuffer());
        }

        return dataUrl;
    }
}

module.exports.CanvasHelper = CanvasHelper