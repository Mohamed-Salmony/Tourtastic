import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import Layout from '@/components/layout/Layout';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useTranslation } from 'react-i18next';

// Form schema for validation
const contactFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  subject: z.string().min(5, { message: 'Subject must be at least 5 characters' }),
  message: z.string().min(10, { message: 'Message must be at least 10 characters' }),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

const Contact: React.FC = () => {
  const { t } = useTranslation();
  const { 
    register, 
    handleSubmit, 
    reset,
    formState: { errors, isSubmitting } 
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
  });

  const onSubmit = async (data: ContactFormValues) => {
    try {
      // Simulate API call with timeout
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Form data:', data);
      toast.success('Your message has been sent! We will get back to you soon.');
      reset();
    } catch (error) {
      toast.error('Failed to send message. Please try again later.');
      console.error('Contact form error:', error);
    }
  };

  return (
    <Layout>
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 py-12">
        <div className="container-custom">
          <h1 className="text-4xl font-bold mb-4">{t('contactUs', 'Contact Us')}</h1>
          <p className="text-gray-600 max-w-2xl">
            {t('contactIntro', "Get in touch with our team for inquiries or support. We're here to help you plan your perfect trip.")}
          </p>
        </div>
      </div>

      <div className="py-12 container-custom">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Contact Form */}
          <div className="animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">{t('sendUsAMessage', 'Send us a message')}</CardTitle>
                <CardDescription>
                  {t('fillOutTheFormBelowAndWe', 'Fill out the form below and we\'ll get back to you as soon as possible.')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t('fullName', 'Full Name')}</Label>
                    <Input 
                      id="name" 
                      placeholder={t('yourName', 'Your name')} 
                      {...register('name')} 
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive">{errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">{t('emailAddress', 'Email Address')}</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder={t('yourEmailExampleCom', 'your.email@example.com')} 
                      {...register('email')} 
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">{t('subject', 'Subject')}</Label>
                    <Input 
                      id="subject" 
                      placeholder={t('whatIsThisRegarding', 'What is this regarding?')} 
                      {...register('subject')} 
                    />
                    {errors.subject && (
                      <p className="text-sm text-destructive">{errors.subject.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">{t('message', 'Message')}</Label>
                    <Textarea 
                      id="message" 
                      placeholder={t('howCanWeHelpYou', 'How can we help you?')} 
                      rows={5}
                      {...register('message')} 
                    />
                    {errors.message && (
                      <p className="text-sm text-destructive">{errors.message.message}</p>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      t('sending', 'Sending...')
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        {t('sendMessage', 'Send Message')}
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Contact Information and Map */}
          <div className="space-y-8 animate-fade-in animation-delay-200">
            {/* Contact Info Cards */}
            <div className="grid grid-cols-1 gap-4">
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  {/* Map */}
                  <div className="w-full h-64 bg-gray-200 relative">
                    <iframe
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2624.9914410203936!2d2.2922926156744847!3d48.858370079287475!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47e66e2964e34e2d%3A0x8ddca9ee380ef7e0!2sEiffel%20Tower!5e0!3m2!1sen!2sus!4v1653296468325!5m2!1sen!2sus"
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Tourtastic Office Location"
                    ></iframe>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="bg-tourtastic-light-blue p-3 rounded-full">
                    <MapPin className="h-6 w-6 text-tourtastic-blue" />
                  </div>
                  <div>
                    <h3 className="font-bold">{t('visitOurOffice', 'Visit Our Office')}</h3>
                    <p className="text-gray-600">{t('address', '123 Travel Street, Paris, France')}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="bg-tourtastic-light-blue p-3 rounded-full">
                    <Phone className="h-6 w-6 text-tourtastic-blue" />
                  </div>
                  <div>
                    <h3 className="font-bold">{t('callUs', 'Call Us')}</h3>
                    <p className="text-gray-600">{t('phoneNumber', '+33 (0) 123 456 789')}</p>
                    <p className="text-sm text-gray-500">{t('callHours', 'Monday to Friday, 9am - 6pm')}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="bg-tourtastic-light-blue p-3 rounded-full">
                    <Mail className="h-6 w-6 text-tourtastic-blue" />
                  </div>
                  <div>
                    <h3 className="font-bold">{t('emailUs', 'Email Us')}</h3>
                    <p className="text-gray-600">{t('emailAddress', 'info@tourtastic.com')}</p>
                    <p className="text-sm text-gray-500">{t('responseTime', 'We\'ll respond within 24 hours')}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Contact;
