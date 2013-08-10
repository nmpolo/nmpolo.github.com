---
title: Symfony2 & Rest with FOSRestBundle
layout: default
description: How to create a RESTful API using Symfony2 with the FOSRestBundle.
---

tl;dr: [source code] (https://github.com/nmpolo/Symfony2Rest)

[FOSRestBundle] (https://github.com/FriendsOfSymfony/FOSRestBundle) is an awesome bundle for creating REST APIs with [Symfony2] (https://github.com/symfony/symfony). This article will describe how to use the bundle along with [Doctrine2] (https://github.com/doctrine/doctrine2) and [JMSSerializerBundle] (https://github.com/schmittjoh/JMSSerializerBundle).

###The Application

To demonstrate how FOSRestBundle can be used, we shall create a very simple application. It will allow CRUDL operations on two entities: organisations and users. Each user will belong to one organisation.

###Configuration

To configure the application, we first need to add the FOSRestBundle to composer.json:

    #composer.json
    "friendsofsymfony/rest-bundle": "dev-master"

Next, register the FOSRestBundle and JMSSerializerBundle

    #app/AppKernel.php
    new JMS\SerializerBundle\JMSSerializerBundle($this),
    new FOS\RestBundle\FOSRestBundle(),

Disable the default view annotations and set up the FOSRest response listener:

    #app/config/config.yml
    sensio_framework_extra:
        view:
            annotations: false
    
    fos_rest:
        param_fetcher_listener: true
        body_listener: true
        format_listener: true
        view:
            view_response_listener: 'force'

####Routing

The RESTful routing is handled implicitly by the FOSRestBundle, we just need to tell it which controllers are RESTful:

    #src/Nmpolo/RestBundle/Resources/config/routing.yml
    organisation:
        type: rest
        resource: Nmpolo\RestBundle\Controller\OrganisationController

    user:
        type: rest
        parent: organisation
        resource: Nmpolo\RestBundle\Controller\UserController

And then tell the application to read our bundle's routing file:

    #app/config/routing.yml
    nmpolo:
        type: rest
        resource: "@NmpoloRestBundle/Resources/config/routing.yml"

Due to the implicit routing, routes will be automatically generated for the actions within each controller.

###Models

Now that the application is configured, we can create the two entities the application requires. These can be created using the Doctrine2 entity generator tool:

    php app/console doctrine:generate:entity

Create an entity with the name `NmpoloRestBundle:Organisation` and then add a string field called `name`. Tell the tool to create an empty repository class and then confirm generation. Next, do the same again to create a `NmpoloRestBundle:User` entity.

Now, we need to add the user => organisation relationship:

    #src/Nmpolo/RestBundle/Entity/User.php
    /**
     * @ORM\ManyToOne(targetEntity="Organisation", inversedBy="users")
     *
     * @var Organisation $organisation
     */
    private $organisation;

    #src/Nmpolo/RestBundle/Entity/Organisation.php
    /**
     * @ORM\OneToMany(targetEntity="User", mappedBy="organisation)
     *
     * @var Doctrine\Common\Collections\Collection $users
     */
    private $users

The getters and setters can automatically be generated for this relationship by running:

    php app/console generate:doctrine:entities NmpoloRestBundle

###Controllers

Now that the entities have been created, we can create the controllers and actions used to manipulate them.

####GET /organisations - List the organisations

We can easily get all organisations using the entity's repository:

    #src/Nmpolo/RestBundle/Controller/OrganisationController.php
    /**
     * Collection get action
     * @var Request $request
     * @return array
     *
     * @Rest\View()
     */
    public function cgetAction(Request $request)
    {
        $em = $this->getDoctrine()->getManager();

        $entities = $em->getRepository('NmpoloRestBundle:Organisation')->findAll();

        return array(
            'entities' => $entities,
        );
    }

####GET /organisations/id - Get a specific organisation

Likewise, we can do something similar to get a specific organisation:

    #src/Nmpolo/RestBundle/Controller/OrganisationController.php
    /**
     * Get entity instance
     * @var integer $id Id of the entity
     * @return Organisation
     */
    protected function getEntity($id)
    {
        $em = $this->getDoctrine()->getManager();

        $entity = $em->getRepository('NmpoloRestBundle:Organisation')->find($id);

        if (!$entity) {
            throw $this->createNotFoundException('Unable to find organisation entity');
        }

        return $entity;
    }

    /**
     * Get action
     * @var integer $id Id of the entity
     * @return array
     *
     * @Rest\View()
     */
    public function getAction($id)
    {
        $entity = $this->getEntity($id);

        return array(
            'entity' => $entity,
        );
    }

####POST /organisations - Create an organisation

Creating an organisation first requires a form we can use to bind a request to. You can automatically generate a form for a Doctrine entity using the command line tool: `php app/console generate:doctrine:form NmpoloRestBundle:Organisation`.

By default, Symfony2 enables CSRF protection for forms. CSRF protection doesn't make much sense for a REST API so you can disable it by adding `'csrf_protection' => false` to the array passed to $resolver->setDefaults().

Symfony2 will also set the form name as "nmpolo_restbundle_organisationtype" so this can be changed to just "organisation" or removed entirely if you don't require a root name.

Now that we have the form, we can write the method to handle post requests:

    #src/Nmpolo/RestBundle/Controller/OrganisationController.php
    /**
     * Collection post action
     * @var Request $request
     * @return View|array
     */
    public function cpostAction(Request $request)
    {
        $entity = new Organisation();
        $form = $this->createForm(new OrganisationType(), $entity);
        $form->bind($request);

        if ($form->isValid()) {
            $em = $this->getDoctrine()->getManager();
            $em->persist($entity);
            $em->flush();

            return $this->redirectView(
                $this->generateUrl(
                    'get_organisation',
                    array('id' => $entity->getId())
                ),
                Codes::HTTP_CREATED
            );
        }

        return array(
            'form' => $form,
        );
    }

####PUT /organisations/id - Update a specific organisation

    #src/Nmpolo/RestBundle/Controller/OrganisationController.php
    /**
     * Put action
     * @var Request $request
     * @var integer $id Id of the entity
     * @return View|array
     */
    public function putAction(Request $request, $id)
    {
        $entity = $this->getEntity($id);
        $form = $this->createForm(new OrganisationType(), $entity);
        $form->bind($request);

        if ($form->isValid()) {
            $em = $this->getDoctrine()->getManager();
            $em->persist($entity);
            $em->flush();

            return $this->view(null, Codes::HTTP_NO_CONTENT);
        }

        return array(
            'form' => $form,
        );
    }

####DELETE /organisations/id - Delete a specific organisation

    #src/Nmpolo/RestBundle/Controller/OrganisationController.php
    /**
     * Delete action
     * @var integer $id Id of the entity
     * @return View
     */
    public function deleteAction($id)
    {
        $entity = $this->getEntity($id);

        $em = $this->getDoctrine()->getManager();
        $em->remove($entity);
        $em->flush();

        return $this->view(null, Codes::HTTP_NO_CONTENT);
    }

####User

As we said in the routing that organisation was the parent of user, all the user routes are appended to the organisation route.

For example, to create a new user, we must `POST /organisations/id/users`. To get a specific user, we must `GET /organisations/id/users/id`.

Please see the source code on github for the user controller.

###Views

JMSSerializerBundle allows us to specify in our request what content type we expect to be returned. For example, if we send the header `Accept: application/json`, we will receive json. Likewise with application/xml. If we want to receive HTML, we will also have to create views to output the data. To see example view scripts, please checkout the example code on github.

####Exposing Properties

The JMSSerializerBundle will, by default, expose all of an entity's properties. This is not ideal if you're storing, say, a user's password. Fortunately, the bundle has a great way to specify which properties to expose and which to exclude:

    #src/Nmpolo/RestBundle/Entity/User.php
    <?php

    namespace Nmpolo\RestBundle\Entity;

    use Doctrine\ORM\Mapping as ORM;
    use Symfony\Component\Validator\Constraints;
    use JMS\SerializerBundle\Annotation\ExclusionPolicy;
    use JMS\SerializerBundle\Annotation\Expose;

    /**
     * Nmpolo\RestBundle\Entity\User
     *
     * @ORM\Table()
     * @ORM\Entity(repositoryClass="Nmpolo\RestBundle\Entity\UserRepository")
     *
     * @ExclusionPolicy("all")
     */
    class User
    {
        /**
         * @var integer $id
         *
         * @ORM\Column(name="id", type="integer")
         * @ORM\Id
         * @ORM\GeneratedValue(strategy="AUTO")
         *
         * @Expose
         */
        private $id;

        /**
         * @var string $name
         *
         * @ORM\Column(name="name", type="string", length=255)
         *
         * @Expose
         */
        private $name;

        /**
         * @var Organisation $organisation
         *
         * @ORM\ManyToOne(targetEntity="Organisation", inversedBy="users")
         */
        private $organisation;

        ...

Using `@ExclusionPolicy("all")` we set the serializer to exlude everything by default and then we define `@Expose` on anything that we do want to expose. In this example, the user's id and name is exposed but not their organisation.

###Response

Response is an integral part of a REST API.

In our application, we throw a not found exception when an organisation or user doesn't exist. This causes a 404 Not Found to be returned by the API.

If our form validation fails, a 400 Bad Request is automatically returned along with any validation error messages.

For get requests, so long as the entity (or entities) is (are) found, we return a 200 OK and a representation of the entity (entities) in our requested format.

When creating a new entity, a 201 Created header is returned with a location header describing where the new entity can be found.

Updates to and deletions of existing entities will result in a 204 No Content header.

###Source

The source code for this example is available [on github] (https://github.com/nmpolo/Symfony2Rest/).

###References

[FOSRestBundle Documentation] (https://github.com/FriendsOfSymfony/FOSRestBundle/blob/master/Resources/doc/index.md)

[REST APIs with Symfony2: The Right Way] (http://williamdurand.fr/2012/08/02/rest-apis-with-symfony2-the-right-way/)
