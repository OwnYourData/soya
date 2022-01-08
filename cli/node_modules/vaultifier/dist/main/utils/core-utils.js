"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onlyContainsHex = exports.onlyContains = void 0;
exports.onlyContains = (value, ...allowedChars) => {
    for (const char of value) {
        if (allowedChars.indexOf(char) === -1)
            return false;
    }
    return true;
};
exports.onlyContainsHex = (value) => exports.onlyContains(value, ...('abcdef1234567890'));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29yZS11dGlscy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy91dGlscy9jb3JlLXV0aWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFhLFFBQUEsWUFBWSxHQUFHLENBQUMsS0FBYSxFQUFFLEdBQUcsWUFBc0IsRUFBVyxFQUFFO0lBQ2hGLEtBQUssTUFBTSxJQUFJLElBQUksS0FBSyxFQUFFO1FBQ3hCLElBQUksWUFBWSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDbkMsT0FBTyxLQUFLLENBQUM7S0FDaEI7SUFFRCxPQUFPLElBQUksQ0FBQztBQUNkLENBQUMsQ0FBQTtBQUVZLFFBQUEsZUFBZSxHQUFHLENBQUMsS0FBYSxFQUFFLEVBQUUsQ0FBQyxvQkFBWSxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDIn0=