// Augment react-router-dom types to include the `future` prop on BrowserRouter
import 'react-router-dom';

declare module 'react-router-dom' {
  interface BrowserRouterProps {
    future?: {
      v7_startTransition?: boolean;
      v7_relativeSplatPath?: boolean;
      // other future flags may be added here in future
    };
  }
}
